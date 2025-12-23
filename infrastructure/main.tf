# TiQology Infrastructure as Code
# Terraform configuration for AWS deployment

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }

  backend "s3" {
    bucket = "tiqology-terraform-state"
    key    = "services/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "tiqology" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "tiqology-vpc"
    Environment = var.environment
    Project     = "TiQology"
  }
}

# Subnets
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.tiqology.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "tiqology-public-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.tiqology.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "tiqology-private-${count.index + 1}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "tiqology" {
  vpc_id = aws_vpc.tiqology.id

  tags = {
    Name = "tiqology-igw"
  }
}

# NAT Gateway
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name = "tiqology-nat-eip-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "tiqology" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "tiqology-nat-${count.index + 1}"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.tiqology.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.tiqology.id
  }

  tags = {
    Name = "tiqology-public-rt"
  }
}

resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.tiqology.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.tiqology[count.index].id
  }

  tags = {
    Name = "tiqology-private-rt-${count.index + 1}"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "tiqology" {
  name     = "tiqology-services"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = concat(aws_subnet.public[*].id, aws_subnet.private[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
  ]

  tags = {
    Name        = "tiqology-services"
    Environment = var.environment
  }
}

# EKS Node Groups

# CPU Node Group (for Voice Engine, general workloads)
resource "aws_eks_node_group" "cpu_nodes" {
  cluster_name    = aws_eks_cluster.tiqology.name
  node_group_name = "cpu-nodes"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = aws_subnet.private[*].id

  instance_types = ["c5.2xlarge"]  # 8 vCPU, 16 GB RAM

  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 2
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    workload = "cpu"
  }

  tags = {
    Name = "tiqology-cpu-nodes"
  }
}

# GPU Node Group (for Video & Inference Engines)
resource "aws_eks_node_group" "gpu_nodes" {
  cluster_name    = aws_eks_cluster.tiqology.name
  node_group_name = "gpu-nodes"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = aws_subnet.private[*].id

  instance_types = ["g5.2xlarge"]  # 8 vCPU, 24 GB RAM, 1x NVIDIA A10G GPU

  scaling_config {
    desired_size = 2
    max_size     = 8
    min_size     = 1
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    workload = "gpu"
    gpu      = "true"
  }

  taint {
    key    = "nvidia.com/gpu"
    value  = "true"
    effect = "NO_SCHEDULE"
  }

  tags = {
    Name = "tiqology-gpu-nodes"
  }
}

# RDS PostgreSQL (for pgvector)
resource "aws_db_instance" "tiqology" {
  identifier             = "tiqology-postgres"
  engine                 = "postgres"
  engine_version         = "16.1"
  instance_class         = "db.t3.large"
  allocated_storage      = 100
  max_allocated_storage  = 500
  storage_type           = "gp3"
  storage_encrypted      = true
  
  db_name  = "tiqology"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.tiqology.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  skip_final_snapshot = var.environment != "production"
  
  tags = {
    Name        = "tiqology-postgres"
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "tiqology" {
  name       = "tiqology-db-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "tiqology-db-subnet"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "tiqology" {
  cluster_id           = "tiqology-redis"
  engine               = "redis"
  node_type            = "cache.t3.medium"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  
  subnet_group_name    = aws_elasticache_subnet_group.tiqology.name
  security_group_ids   = [aws_security_group.redis.id]

  tags = {
    Name        = "tiqology-redis"
    Environment = var.environment
  }
}

resource "aws_elasticache_subnet_group" "tiqology" {
  name       = "tiqology-cache-subnet"
  subnet_ids = aws_subnet.private[*].id
}

# Security Groups
resource "aws_security_group" "rds" {
  name        = "tiqology-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.tiqology.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tiqology-rds-sg"
  }
}

resource "aws_security_group" "redis" {
  name        = "tiqology-redis-sg"
  description = "Security group for Redis"
  vpc_id      = aws_vpc.tiqology.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tiqology-redis-sg"
  }
}

# S3 Bucket for model storage
resource "aws_s3_bucket" "models" {
  bucket = "tiqology-models-${var.environment}"

  tags = {
    Name        = "tiqology-models"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "models" {
  bucket = aws_s3_bucket.models.id

  versioning_configuration {
    status = "Enabled"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "services" {
  name              = "/aws/eks/tiqology-services"
  retention_in_days = 30

  tags = {
    Name        = "tiqology-services-logs"
    Environment = var.environment
  }
}

# IAM Roles
resource "aws_iam_role" "eks_cluster" {
  name = "tiqology-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role" "eks_node_group" {
  name = "tiqology-eks-node-group-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group.name
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# Outputs
output "eks_cluster_endpoint" {
  value = aws_eks_cluster.tiqology.endpoint
}

output "eks_cluster_name" {
  value = aws_eks_cluster.tiqology.name
}

output "rds_endpoint" {
  value     = aws_db_instance.tiqology.endpoint
  sensitive = true
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.tiqology.cache_nodes[0].address
}

output "s3_bucket_models" {
  value = aws_s3_bucket.models.bucket
}

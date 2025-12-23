variable "aws_region" {
  description = "AWS region for infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "tiqology_admin"
  sensitive   = true
}

variable "db_password" {
  description = "PostgreSQL master password"
  type        = string
  sensitive   = true
}

variable "enable_gpu_nodes" {
  description = "Enable GPU nodes for Video and Inference engines"
  type        = bool
  default     = true
}

variable "cpu_node_count" {
  description = "Number of CPU nodes"
  type        = number
  default     = 3
}

variable "gpu_node_count" {
  description = "Number of GPU nodes"
  type        = number
  default     = 2
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "TiQology"
    ManagedBy   = "Terraform"
    CostCenter  = "AI-Services"
  }
}

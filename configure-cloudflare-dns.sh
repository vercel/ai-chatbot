#!/bin/bash

# ============================================
# Cloudflare DNS Configuration Script
# TiQology Elite v1.5
# ============================================

CLOUDFLARE_API_TOKEN="0Y1VsGarWDpeykQ536UKcy3H-n07qtvs4S7G1iBu"
ZONE_ID="6a1096f7d73f43f0bad0e183dbfdff59"

echo "🌐 Configuring DNS for tiqology.com..."
echo ""

# First, let's see what records already exist
echo "📋 Checking existing DNS records..."
curl -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.result[] | {name: .name, type: .type, content: .content, proxied: .proxied}'

echo ""
echo "============================================"
echo ""

# Function to add or update DNS record
add_or_update_record() {
    local NAME=$1
    local TARGET=$2
    
    echo "🔧 Configuring ${NAME}.tiqology.com..."
    
    # Check if record exists
    EXISTING_RECORD=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${NAME}.tiqology.com" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json")
    
    RECORD_ID=$(echo $EXISTING_RECORD | jq -r '.result[0].id // empty')
    
    if [ -n "$RECORD_ID" ]; then
        # Update existing record
        echo "   ↻ Updating existing record..."
        curl -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${RECORD_ID}" \
          -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
          -H "Content-Type: application/json" \
          --data "{
            \"type\": \"CNAME\",
            \"name\": \"${NAME}\",
            \"content\": \"${TARGET}\",
            \"ttl\": 1,
            \"proxied\": true
          }" | jq '.success'
    else
        # Create new record
        echo "   ✨ Creating new record..."
        curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
          -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
          -H "Content-Type: application/json" \
          --data "{
            \"type\": \"CNAME\",
            \"name\": \"${NAME}\",
            \"content\": \"${TARGET}\",
            \"ttl\": 1,
            \"proxied\": true
          }" | jq '.success'
    fi
    
    echo "   ✅ ${NAME}.tiqology.com configured"
    echo ""
}

# Add/Update DNS records
add_or_update_record "www" "cname.vercel-dns.com"
add_or_update_record "api" "cname.vercel-dns.com"
add_or_update_record "app" "cname.vercel-dns.com"

echo "============================================"
echo "✅ DNS Configuration Complete!"
echo ""
echo "Your DNS records:"
echo "  • www.tiqology.com → cname.vercel-dns.com (Proxied)"
echo "  • api.tiqology.com → cname.vercel-dns.com (Proxied)"
echo "  • app.tiqology.com → cname.vercel-dns.com (Proxied)"
echo ""
echo "⏳ DNS propagation can take 5-60 minutes"
echo ""
echo "🔍 Verify with:"
echo "  dig www.tiqology.com"
echo "  dig api.tiqology.com"
echo ""

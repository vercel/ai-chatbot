# Sales Data Analysis

# First, let's parse our CSV data
# In a real implementation, we would use pandas
# This is a simplified version

data = []
with open("data-csv.csv", "r") as f:
    lines = f.readlines()
    headers = lines[0].strip().split(",")
    for line in lines[1:]:
        values = line.strip().split(",")
        row = {headers[i]: values[i] for i in range(len(headers))}
        # Convert numeric fields
        row["units"] = int(row["units"])
        row["revenue"] = int(row["revenue"])
        data.append(row)

print(f"Loaded {len(data)} rows of data")

# Calculate total sales by region
sales_by_region = {}
for row in data:
    region = row["region"]
    revenue = row["revenue"]
    if region in sales_by_region:
        sales_by_region[region] += revenue
    else:
        sales_by_region[region] = revenue

print("\nTotal Sales by Region:")
for region, revenue in sales_by_region.items():
    print(f"{region}: ${revenue}")

# Find the best performing month
sales_by_month = {}
for row in data:
    month = row["month"]
    revenue = row["revenue"]
    if month in sales_by_month:
        sales_by_month[month] += revenue
    else:
        sales_by_month[month] = revenue

best_month = max(sales_by_month.items(), key=lambda x: x[1])
print(f"\nBest performing month: {best_month[0]} with ${best_month[1]} in sales")

# Analyze products
sales_by_product = {}
for row in data:
    product = row["product"]
    revenue = row["revenue"]
    if product in sales_by_product:
        sales_by_product[product] += revenue
    else:
        sales_by_product[product] = revenue

print("\nSales by Product:")
for product, revenue in sales_by_product.items():
    print(f"{product}: ${revenue}")

# Calculate average revenue per unit
total_units = sum(row["units"] for row in data)
total_revenue = sum(row["revenue"] for row in data)
avg_revenue_per_unit = total_revenue / total_units

print(f"\nAverage revenue per unit: ${avg_revenue_per_unit:.2f}")

# In a real implementation, we would create visualizations here

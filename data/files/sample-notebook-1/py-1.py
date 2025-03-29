# Python sample code
import random
import math


def generate_random_data(count=5):
    """Generate random data points"""
    return [(random.random(), random.random()) for _ in range(count)]


def calculate_distance(point1, point2):
    """Calculate Euclidean distance between two points"""
    return math.sqrt((point2[0] - point1[0]) ** 2 + (point2[1] - point1[1]) ** 2)


# Generate some random points
points = generate_random_data(5)
print("Generated points:")
for i, point in enumerate(points):
    print(f"Point {i + 1}: ({point[0]:.2f}, {point[1]:.2f})")

# Calculate distances between points
print("\nDistances between points:")
for i in range(len(points)):
    for j in range(i + 1, len(points)):
        dist = calculate_distance(points[i], points[j])
        print(f"Distance between point {i + 1} and point {j + 1}: {dist:.2f}")

print("\nHello, World!")

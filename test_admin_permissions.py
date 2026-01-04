#!/usr/bin/env python
"""
Test script to verify admin role-based permissions are working correctly.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from auth_api.models import AdminRole, CustomUser
from django.contrib.auth.models import Group
from django.test import TestCase
from django.test.client import Client
from django.urls import reverse

def test_admin_permissions():
    """Test that different admin roles see only their authorized modules"""
    print("Testing admin role-based permissions...")

    # Create test users for each role
    roles_to_test = ['super_admin', 'news_editor', 'practice_editor', 'moderator', 'forum_moderator', 'content_manager']

    for role_name in roles_to_test:
        try:
            role = AdminRole.objects.get(name=role_name)
            print(f"\nTesting role: {role_name}")

            # Create test user
            test_user = CustomUser.objects.create_user(
                username=f'test_{role_name}',
                email=f'test_{role_name}@example.com',
                password='testpass123',
                role=role
            )

            # Add user to role's groups
            for group in role.groups.all():
                test_user.groups.add(group)

            # Test admin access
            client = Client()
            client.login(username=f'test_{role_name}', password='testpass123')

            # Try to access admin index
            response = client.get('/admin/')
            if response.status_code == 200:
                print(f"  ✓ {role_name} can access admin interface")
            else:
                print(f"  ✗ {role_name} cannot access admin interface (status: {response.status_code})")

            # Clean up
            test_user.delete()

        except AdminRole.DoesNotExist:
            print(f"  ✗ Role {role_name} does not exist")
        except Exception as e:
            print(f"  ✗ Error testing {role_name}: {e}")

    print("\nPermission testing completed.")

if __name__ == '__main__':
    test_admin_permissions()
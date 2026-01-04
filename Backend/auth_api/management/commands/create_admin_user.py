from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from auth_api.models import AdminRole, CustomUser

class Command(BaseCommand):
    help = 'Create admin users with different roles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--role',
            type=str,
            required=True,
            choices=['super_admin', 'news_editor', 'practice_editor', 'moderator', 'forum_moderator', 'content_manager'],
            help='Role for the admin user'
        )
        parser.add_argument(
            '--username',
            type=str,
            required=True,
            help='Username for the admin user'
        )
        parser.add_argument(
            '--email',
            type=str,
            required=True,
            help='Email for the admin user'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin123',
            help='Password for the admin user (default: admin123)'
        )
        parser.add_argument(
            '--first-name',
            type=str,
            default='',
            help='First name for the admin user'
        )
        parser.add_argument(
            '--last-name',
            type=str,
            default='',
            help='Last name for the admin user'
        )

    def handle(self, *args, **options):
        role_name = options['role']
        username = options['username']
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']

        try:
            # 获取角色
            role = AdminRole.objects.get(name=role_name)
            self.stdout.write(f'Found role: {role.display_name}')

            # 检查用户是否已存在
            if CustomUser.objects.filter(username=username).exists():
                self.stdout.write(
                    self.style.ERROR(f'User {username} already exists')
                )
                return

            # 创建用户
            user = CustomUser.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=role,
                is_staff=True,
                is_superuser=(role_name == 'super_admin')
            )

            # 将用户添加到角色的所有组中
            for group in role.groups.all():
                user.groups.add(group)
                self.stdout.write(f'Added user to group: {group.name}')

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created {role.display_name} user: {username}'
                )
            )
            self.stdout.write(f'Email: {email}')
            self.stdout.write(f'Password: {password}')
            self.stdout.write(f'Login URL: http://localhost:8000/admin/')

        except AdminRole.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Role {role_name} does not exist')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating user: {e}')
            )
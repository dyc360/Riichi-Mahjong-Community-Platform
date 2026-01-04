from typing import Iterable

from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand
from django.db import transaction

from auth_api.models import AdminRole, CustomUser


ROLE_CONFIG = {
    'super_admin': {
        'display_name': '超级管理员',
        'description': '拥有系统所有权限的超级管理员',
        'groups': ['admin'],
        'apps': '__all__',
    },
    'news_editor': {
        'display_name': '新闻编辑者',
        'description': '负责新闻内容的编辑和发布',
        'groups': ['news-editor'],
        'apps': ['news_api'],
    },
    'practice_editor': {
        'display_name': '练习编辑者',
        'description': '负责麻将练习内容的维护',
        'groups': ['practice-editor'],
        'apps': ['mahjong_api'],
    },
    'moderator': {
        'display_name': '版主',
        'description': '管理论坛内容并协助审核新闻',
        'groups': ['moderator'],
        'apps': ['forum_api', 'news_api'],
    },
    'forum_moderator': {
        'display_name': '论坛版主',
        'description': '专注于论坛内容的管理',
        'groups': ['forum_moderator'],
        'apps': ['forum_api'],
    },
    'content_manager': {
        'display_name': '内容管理员',
        'description': '负责综合内容模块的管理',
        'groups': ['content-manager'],
        'apps': ['auth_api', 'mahjong_api', 'news_api', 'forum_api', 'mleague'],
    },
}


def _collect_permissions(apps: Iterable[str] | str) -> Iterable[Permission]:
    if apps == '__all__':
        return Permission.objects.all()
    return Permission.objects.filter(content_type__app_label__in=apps)


def ensure_admin_roles() -> None:
    """确保基础角色、关联组和权限都已准备好。"""
    for role_name, config in ROLE_CONFIG.items():
        groups_to_assign = []
        for group_name in config.get('groups', []):
            group, _ = Group.objects.get_or_create(name=group_name)
            groups_to_assign.append(group)

        role_defaults = {
            'display_name': config['display_name'],
            'description': config['description'],
            'is_active': True,
        }

        role, created = AdminRole.objects.get_or_create(
            name=role_name,
            defaults=role_defaults,
        )

        if not created:
            dirty = False
            for field, value in role_defaults.items():
                if getattr(role, field) != value:
                    setattr(role, field, value)
                    dirty = True
            if dirty:
                role.save(update_fields=list(role_defaults.keys()))

        role.groups.set(groups_to_assign)

        perms = list(_collect_permissions(config['apps']))
        role.permissions.set(perms)

        for group in groups_to_assign:
            group.permissions.set(perms)


class Command(BaseCommand):
    help = 'Create admin users with different roles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--role',
            type=str,
            required=True,
            choices=list(ROLE_CONFIG.keys()),
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

    @transaction.atomic
    def handle(self, *args, **options):
        ensure_admin_roles()

        role_name = options['role']
        username = options['username']
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']

        try:
            role = AdminRole.objects.get(name=role_name)
            self.stdout.write(f'Found role: {role.display_name}')

            user, created = CustomUser.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                }
            )

            if created:
                self.stdout.write(f'Created user record for {username}')
            else:
                self.stdout.write(f'Updating existing user: {username}')
                user.email = email
                user.first_name = first_name
                user.last_name = last_name

            if password:
                user.set_password(password)

            user.role = role
            user.is_staff = True
            user.is_superuser = (role_name == 'super_admin')
            user.is_active = True
            user.save()

            groups = list(role.groups.all())
            if groups:
                user.groups.set(groups)
                for group in groups:
                    self.stdout.write(f'Ensured membership in group: {group.name}')
            else:
                user.groups.clear()

            if user.is_superuser:
                user.user_permissions.clear()
            else:
                perms = list(role.permissions.all())
                if perms:
                    user.user_permissions.set(perms)
                    self.stdout.write(f'Assigned {len(perms)} permissions from role')
                else:
                    user.user_permissions.clear()

            action = 'created' if created else 'updated'
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully {action} {role.display_name} user: {username}'
                )
            )
            self.stdout.write(f'Email: {email}')
            self.stdout.write(f'Password: {password}')
            self.stdout.write(f'Login URL: http://localhost:8000/admin/')

        except AdminRole.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Role {role_name} does not exist')
            )
        except Exception as exc:  # noqa: BLE001
            self.stdout.write(
                self.style.ERROR(f'Error creating user: {exc}')
            )
# auth_api/management/commands/assign_role.py
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import Group
from auth_api.models import CustomUser


class Command(BaseCommand):
    help = '为用户分配角色'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='用户名')
        parser.add_argument('role_name', type=str, help='角色名称')

    def handle(self, *args, **options):
        username = options['username']
        role_name = options['role_name']

        # 检查用户是否存在
        try:
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            raise CommandError(f'用户 "{username}" 不存在')

        # 检查角色是否存在
        try:
            group = Group.objects.get(name=role_name)
        except Group.DoesNotExist:
            available_roles = list(Group.objects.values_list('name', flat=True))
            raise CommandError(f'角色 "{role_name}" 不存在。可用角色: {", ".join(available_roles)}')

        # 清除用户现有的角色（可选，如果需要支持多角色可以注释掉）
        user.groups.clear()

        # 分配新角色
        user.groups.add(group)

        self.stdout.write(
            self.style.SUCCESS(f'成功为用户 "{username}" 分配角色 "{role_name}"')
        )

        # 显示用户当前权限
        permissions = user.get_group_permissions()
        if permissions:
            self.stdout.write(f'用户权限: {", ".join(sorted(permissions))}')
        else:
            self.stdout.write('用户暂无特殊权限')
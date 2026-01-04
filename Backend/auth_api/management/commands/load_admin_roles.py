from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings
import os


class Command(BaseCommand):
    help = 'Load admin roles fixture data'

    def handle(self, *args, **options):
        fixture_path = os.path.join(settings.BASE_DIR, 'auth_api', 'fixtures', 'admin_roles.json')

        if os.path.exists(fixture_path):
            self.stdout.write('Loading admin roles fixture...')
            call_command('loaddata', 'admin_roles', verbosity=2)
            self.stdout.write(
                self.style.SUCCESS('Successfully loaded admin roles fixture')
            )
        else:
            self.stdout.write(
                self.style.ERROR(f'Fixture file not found: {fixture_path}')
            )
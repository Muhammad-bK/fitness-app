from django.core.management.base import BaseCommand

from apps.intelligence.utils.muscle_mapping import MUSCLE_ANATOMY, NINJAS_MUSCLE_MAP


class Command(BaseCommand):
    help = "Display muscle mapping seed data (anatomy intelligence reference)"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Muscle Anatomy Mapping"))
        for group, data in MUSCLE_ANATOMY.items():
            self.stdout.write(f"  {group}: {', '.join(data['sub_regions'])}")

        self.stdout.write(self.style.SUCCESS("\nAPI Ninjas → Anatomy Map"))
        for ninja, (group, sub) in NINJAS_MUSCLE_MAP.items():
            self.stdout.write(f"  {ninja} → {group}/{sub or 'general'}")

        self.stdout.write(self.style.SUCCESS(f"\nTotal mappings: {len(NINJAS_MUSCLE_MAP)}"))

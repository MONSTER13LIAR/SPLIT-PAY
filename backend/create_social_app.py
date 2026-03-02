import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site

site, _ = Site.objects.get_or_create(id=1, defaults={'domain': 'localhost:3000', 'name': 'localhost'})

app, created = SocialApp.objects.get_or_create(
    provider='google',
    name='Google Auth',
    defaults={
        'client_id': '518518930801-6b3lu430juulj4o9d38tvc0sk71vno0q.apps.googleusercontent.com',
        'secret': 'REPLACE_ME', # Normally secret is needed but we might bypass it or put a dummy check
    }
)
app.sites.add(site)
app.save()

print("Google Social App configured.")

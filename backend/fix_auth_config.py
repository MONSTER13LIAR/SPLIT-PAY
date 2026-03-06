import os
import django
import sys

# Setup Django
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
from django.conf import settings

def setup():
    # Fix Site
    site_id = getattr(settings, 'SITE_ID', 1)
    site, created = Site.objects.get_or_create(id=site_id)
    site.domain = 'localhost:3000'
    site.name = 'SplitPay Dev'
    site.save()
    print(f"Fixed Site ID {site_id}: {site.domain}")

    # Fix/Create SocialApp
    client_id = os.getenv('GOOGLE_CLIENT_ID')
    secret = os.getenv('GOOGLE_SECRET')
    
    if not client_id or not secret:
        print("ERROR: GOOGLE_CLIENT_ID or GOOGLE_SECRET missing from environment.")
        return

    app, created = SocialApp.objects.get_or_create(
        provider='google',
        defaults={
            'name': 'Google Auth',
            'client_id': client_id,
            'secret': secret,
        }
    )
    
    if not created:
        app.client_id = client_id
        app.secret = secret
        app.save()
        print("Updated existing SocialApp.")
    else:
        print("Created new SocialApp.")

    app.sites.add(site)
    app.save()
    print(f"SocialApp '{app.name}' linked to site '{site.domain}'.")

if __name__ == "__main__":
    setup()

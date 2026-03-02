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

with open('/home/monster13liar/SPLIT-PAY/auth_diag.log', 'w') as f:
    f.write("--- Auth Diagnosis ---\n")
    f.write(f"SITE_ID: {settings.SITE_ID}\n")
    f.write("Sites:\n")
    for site in Site.objects.all():
        f.write(f"  ID: {site.id}, Domain: {site.domain}, Name: {site.name}\n")
    
    f.write("SocialApps:\n")
    for app in SocialApp.objects.all():
        f.write(f"  Provider: {app.provider}, Client ID: {app.client_id}, Secret: {'[HIDDEN]' if app.secret else '[MISSING]'}\n")
    
    f.write("--- End Diag ---\n")

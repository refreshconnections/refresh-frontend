from django.shortcuts import render
from refreshapp.settings import DEBUG, STAGING

def index(request):

    if DEBUG:
        print("DEBUG IS TRUE")
        return render(request, 'frontend/index_local.html')
    elif STAGING == "True":
        print("STAGING IS TRUE")
        return render(request, 'frontend/index_staging.html')
    else:
        return render(request, 'frontend/index.html')
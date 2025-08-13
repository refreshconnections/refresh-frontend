from django.urls import path, include, re_path
from . import views
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django_private_chat2_fork import urls

application = ProtocolTypeRouter({
    "websocket": AuthMiddlewareStack(
        URLRouter(
            urls.websocket_urlpatterns
        )
    ),
})
# from rest_framework import routers

# router = routers.DefaultRouter()
# router.register(r'index', views.index, 'index')

urlpatterns = [
    path('', views.index ),
    re_path(r".*", views.index),
    # path('', include(router.urls))
    # re_path(r'^(?:.*)/?$', views.index)
]
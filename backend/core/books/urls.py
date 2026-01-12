from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import BookViewSet, AuthorViewSet
from . import views

router = DefaultRouter()
router.register(r'api/authors', AuthorViewSet)
router.register(r'api/books', BookViewSet)

urlpatterns = [
    # HTML views
    path('', views.home, name='home'),
    path('authors/', views.author_list, name='author_list'),
    path('books/', views.book_list, name='book_list'),

    # API endpoints
    path('', include(router.urls)),
]
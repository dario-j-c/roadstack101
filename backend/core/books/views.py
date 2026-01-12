from django.shortcuts import render
from .models import Author, Book


def home(request):
    """Home page view with links to authors and books."""
    return render(request, 'books/home.html')


def author_list(request):
    """Display all authors in a table."""
    authors = Author.objects.all()
    return render(request, 'books/author_list.html', {'authors': authors})


def book_list(request):
    """Display all books in a table."""
    books = Book.objects.select_related('author').all()
    return render(request, 'books/book_list.html', {'books': books})

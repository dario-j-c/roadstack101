from django.contrib import admin
from .models import Book, Author


class BookInline(admin.TabularInline):
    """
    Inline admin to show books within author detail page.
    """
    model = Book
    extra = 0
    fields = ('title', 'published_date', 'isbn')
    readonly_fields = ('title', 'published_date', 'isbn')
    can_delete = False
    show_change_link = True


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'birth_date', 'book_count')
    search_fields = ('name', 'country')
    list_filter = ('country',)
    ordering = ('name',)
    inlines = [BookInline]

    def book_count(self, obj):
        """Display the number of books by this author."""
        return obj.books.count()
    book_count.short_description = 'Books'


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'published_date', 'isbn')
    search_fields = ('title', 'author__name', 'isbn')
    list_filter = ('published_date', 'author')
    ordering = ('title',)
    date_hierarchy = 'published_date'
    raw_id_fields = ('author',)

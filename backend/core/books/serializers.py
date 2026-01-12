from rest_framework import serializers
from .models import Book, Author


class BookSummarySerializer(serializers.ModelSerializer):
    """
    Simple serializer for books without nested author (to avoid circular reference).
    """
    class Meta:
        model = Book
        fields = ['id', 'title', 'published_date', 'isbn']


class AuthorSerializer(serializers.ModelSerializer):
    """
    Serializer for the Author model with nested books.
    """
    books = BookSummarySerializer(many=True, read_only=True)

    class Meta:
        model = Author
        fields = ['id', 'name', 'birth_date', 'country', 'books']


class BookSerializer(serializers.ModelSerializer):
    """
    Serializer for the Book model with nested author data.
    Shows full author object in responses, accepts author ID for creation/updates.
    """
    author = AuthorSerializer(read_only=True)
    author_id = serializers.PrimaryKeyRelatedField(
        queryset=Author.objects.all(),
        source='author',
        write_only=True
    )

    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'author_id', 'published_date', 'isbn']


import json
import os
from django.core.management.base import BaseCommand
from books.models import Author, Book


class Command(BaseCommand):
    help = 'Load sample data from JSON file into the database'

    def handle(self, *args, **options):
        # Get the path to the JSON file
        json_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            'data',
            'sample_data.json'
        )

        # Read the JSON file
        with open(json_file, 'r') as f:
            data = json.load(f)

        # Clear existing data
        self.stdout.write('Clearing existing data...')
        Book.objects.all().delete()
        Author.objects.all().delete()

        # Create authors
        self.stdout.write('Creating authors...')
        authors = {}
        for author_data in data['authors']:
            author = Author.objects.create(
                id=author_data['id'],
                name=author_data['name'],
                birth_date=author_data['birth_date'],
                country=author_data['country']
            )
            authors[author.id] = author
            self.stdout.write(f'  Created: {author.name}')

        # Create books
        self.stdout.write('Creating books...')
        for book_data in data['books']:
            book = Book.objects.create(
                title=book_data['title'],
                author=authors[book_data['author_id']],
                published_date=book_data['published_date'],
                isbn=book_data['isbn']
            )
            self.stdout.write(f'  Created: {book.title} by {book.author.name}')

        self.stdout.write(self.style.SUCCESS(
            f'\nSuccessfully loaded {len(authors)} authors and {len(data["books"])} books'
        ))

"""
Document converter service for converting between docx and HTML.
"""
import os
import uuid
import tempfile
from pathlib import Path

import mammoth
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH


class DocumentConverter:
    """Service for converting documents between formats."""

    def docx_to_html(self, file_path: str) -> str:
        """
        Convert a docx file to HTML for Tiptap editor.

        Args:
            file_path: Path to the docx file

        Returns:
            HTML string
        """
        with open(file_path, 'rb') as docx_file:
            result = mammoth.convert_to_html(docx_file)
            return result.value

    def html_to_docx(self, html_content: str, title: str) -> str:
        """
        Convert HTML content to a docx file.

        Args:
            html_content: HTML string from Tiptap editor
            title: Document title

        Returns:
            Path to the generated docx file
        """
        from bs4 import BeautifulSoup

        # Create a new document
        doc = Document()

        # Parse HTML
        soup = BeautifulSoup(html_content, 'html.parser')

        # Process each element
        for element in soup.children:
            self._process_element(doc, element)

        # Save to temp file
        temp_dir = tempfile.gettempdir()
        output_path = os.path.join(temp_dir, f'{uuid.uuid4()}.docx')
        doc.save(output_path)

        return output_path

    def _process_element(self, doc: Document, element):
        """Process an HTML element and add it to the document."""
        if element.name is None:
            # Text node
            text = str(element).strip()
            if text:
                doc.add_paragraph(text)
            return

        if element.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            level = int(element.name[1])
            heading = doc.add_heading(element.get_text(), level=level)

        elif element.name == 'p':
            para = doc.add_paragraph()
            self._process_inline(para, element)

        elif element.name == 'ul':
            for li in element.find_all('li', recursive=False):
                para = doc.add_paragraph(li.get_text(), style='List Bullet')

        elif element.name == 'ol':
            for li in element.find_all('li', recursive=False):
                para = doc.add_paragraph(li.get_text(), style='List Number')

        elif element.name == 'blockquote':
            para = doc.add_paragraph(element.get_text())
            para.style = 'Quote'

        elif element.name == 'table':
            self._process_table(doc, element)

        elif element.name in ['div', 'section', 'article']:
            # Container elements - process children
            for child in element.children:
                self._process_element(doc, child)

    def _process_inline(self, paragraph, element):
        """Process inline elements within a paragraph."""
        for child in element.children:
            if child.name is None:
                # Text node
                paragraph.add_run(str(child))
            elif child.name == 'strong' or child.name == 'b':
                run = paragraph.add_run(child.get_text())
                run.bold = True
            elif child.name == 'em' or child.name == 'i':
                run = paragraph.add_run(child.get_text())
                run.italic = True
            elif child.name == 'u':
                run = paragraph.add_run(child.get_text())
                run.underline = True
            elif child.name == 'a':
                # Links - just add text for now
                paragraph.add_run(child.get_text())
            else:
                paragraph.add_run(child.get_text())

    def _process_table(self, doc: Document, table_element):
        """Process an HTML table element."""
        rows = table_element.find_all('tr')
        if not rows:
            return

        # Count columns from first row
        first_row = rows[0]
        cols = len(first_row.find_all(['td', 'th']))

        if cols == 0:
            return

        # Create table
        table = doc.add_table(rows=len(rows), cols=cols)
        table.style = 'Table Grid'

        for i, row in enumerate(rows):
            cells = row.find_all(['td', 'th'])
            for j, cell in enumerate(cells):
                if j < cols:
                    table.rows[i].cells[j].text = cell.get_text()

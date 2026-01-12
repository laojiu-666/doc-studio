"""
Style parser for converting CSS styles to python-docx format.
"""
import re
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from docx.shared import Pt, Inches, RGBColor, Cm, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT


@dataclass
class FontStyle:
    """Font style properties."""
    name: Optional[str] = None
    size: Optional[Pt] = None
    bold: Optional[bool] = None
    italic: Optional[bool] = None
    underline: Optional[bool] = None
    strike: Optional[bool] = None
    color: Optional[RGBColor] = None
    highlight_color: Optional[RGBColor] = None


@dataclass
class ParagraphStyle:
    """Paragraph style properties."""
    alignment: Optional[WD_ALIGN_PARAGRAPH] = None
    line_spacing: Optional[float] = None
    space_before: Optional[Pt] = None
    space_after: Optional[Pt] = None
    first_line_indent: Optional[Pt] = None
    left_indent: Optional[Pt] = None
    right_indent: Optional[Pt] = None


@dataclass
class PageSetup:
    """Page setup properties."""
    margin_top: Optional[Inches] = None
    margin_bottom: Optional[Inches] = None
    margin_left: Optional[Inches] = None
    margin_right: Optional[Inches] = None
    page_width: Optional[Inches] = None
    page_height: Optional[Inches] = None
    header_distance: Optional[Inches] = None
    footer_distance: Optional[Inches] = None


class StyleParser:
    """Parse CSS styles and convert to python-docx format."""

    # CSS color name to RGB mapping
    COLOR_MAP = {
        'black': (0, 0, 0), 'white': (255, 255, 255), 'red': (255, 0, 0),
        'green': (0, 128, 0), 'blue': (0, 0, 255), 'yellow': (255, 255, 0),
        'cyan': (0, 255, 255), 'magenta': (255, 0, 255), 'gray': (128, 128, 128),
        'grey': (128, 128, 128), 'orange': (255, 165, 0), 'purple': (128, 0, 128),
        'pink': (255, 192, 203), 'brown': (165, 42, 42), 'navy': (0, 0, 128),
    }

    # Text alignment mapping
    ALIGN_MAP = {
        'left': WD_ALIGN_PARAGRAPH.LEFT,
        'center': WD_ALIGN_PARAGRAPH.CENTER,
        'right': WD_ALIGN_PARAGRAPH.RIGHT,
        'justify': WD_ALIGN_PARAGRAPH.JUSTIFY,
    }

    def parse_style_string(self, style_str: str) -> Dict[str, str]:
        """Parse CSS style string into dict."""
        if not style_str:
            return {}
        styles = {}
        for item in style_str.split(';'):
            if ':' in item:
                key, value = item.split(':', 1)
                styles[key.strip().lower()] = value.strip()
        return styles

    def parse_color(self, color_str: str) -> Optional[RGBColor]:
        """Parse CSS color to RGBColor."""
        if not color_str:
            return None
        color_str = color_str.strip().lower()

        # Named color
        if color_str in self.COLOR_MAP:
            r, g, b = self.COLOR_MAP[color_str]
            return RGBColor(r, g, b)

        # Hex color (#rgb or #rrggbb)
        if color_str.startswith('#'):
            hex_color = color_str[1:]
            if len(hex_color) == 3:
                hex_color = ''.join(c * 2 for c in hex_color)
            if len(hex_color) == 6:
                r = int(hex_color[0:2], 16)
                g = int(hex_color[2:4], 16)
                b = int(hex_color[4:6], 16)
                return RGBColor(r, g, b)

        # rgb(r, g, b)
        rgb_match = re.match(r'rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)', color_str)
        if rgb_match:
            r, g, b = map(int, rgb_match.groups())
            return RGBColor(min(r, 255), min(g, 255), min(b, 255))

        return None

    def parse_size(self, size_str: str) -> Optional[Pt]:
        """Parse CSS size to Pt."""
        if not size_str:
            return None
        size_str = size_str.strip().lower()

        # pt
        if size_str.endswith('pt'):
            try:
                return Pt(float(size_str[:-2]))
            except ValueError:
                return None

        # px (approximate: 1px ≈ 0.75pt)
        if size_str.endswith('px'):
            try:
                return Pt(float(size_str[:-2]) * 0.75)
            except ValueError:
                return None

        # em (approximate: 1em = 12pt)
        if size_str.endswith('em'):
            try:
                return Pt(float(size_str[:-2]) * 12)
            except ValueError:
                return None

        # cm
        if size_str.endswith('cm'):
            try:
                return Pt(float(size_str[:-2]) * 28.35)
            except ValueError:
                return None

        # in
        if size_str.endswith('in'):
            try:
                return Pt(float(size_str[:-2]) * 72)
            except ValueError:
                return None

        # Plain number (assume pt)
        try:
            return Pt(float(size_str))
        except ValueError:
            return None

    def parse_inches(self, size_str: str) -> Optional[Inches]:
        """Parse CSS size to Inches."""
        if not size_str:
            return None
        size_str = size_str.strip().lower()

        if size_str.endswith('in'):
            try:
                return Inches(float(size_str[:-2]))
            except ValueError:
                return None

        if size_str.endswith('cm'):
            try:
                return Inches(float(size_str[:-2]) / 2.54)
            except ValueError:
                return None

        if size_str.endswith('mm'):
            try:
                return Inches(float(size_str[:-2]) / 25.4)
            except ValueError:
                return None

        if size_str.endswith('pt'):
            try:
                return Inches(float(size_str[:-2]) / 72)
            except ValueError:
                return None

        return None

    def parse_font_style(self, styles: Dict[str, str]) -> FontStyle:
        """Parse CSS styles to FontStyle."""
        font = FontStyle()

        if 'font-family' in styles:
            # Take first font family
            font.name = styles['font-family'].split(',')[0].strip().strip('"\'')

        if 'font-size' in styles:
            font.size = self.parse_size(styles['font-size'])

        if 'font-weight' in styles:
            weight = styles['font-weight'].lower()
            font.bold = weight in ('bold', '700', '800', '900')

        if 'font-style' in styles:
            font.italic = styles['font-style'].lower() == 'italic'

        if 'text-decoration' in styles:
            dec = styles['text-decoration'].lower()
            font.underline = 'underline' in dec
            font.strike = 'line-through' in dec

        if 'color' in styles:
            font.color = self.parse_color(styles['color'])

        if 'background-color' in styles:
            font.highlight_color = self.parse_color(styles['background-color'])

        return font

    def parse_paragraph_style(self, styles: Dict[str, str]) -> ParagraphStyle:
        """Parse CSS styles to ParagraphStyle."""
        para = ParagraphStyle()

        if 'text-align' in styles:
            align = styles['text-align'].lower()
            para.alignment = self.ALIGN_MAP.get(align)

        if 'line-height' in styles:
            lh = styles['line-height']
            try:
                if lh.endswith('%'):
                    para.line_spacing = float(lh[:-1]) / 100
                else:
                    para.line_spacing = float(lh)
            except ValueError:
                pass

        if 'margin-top' in styles:
            para.space_before = self.parse_size(styles['margin-top'])

        if 'margin-bottom' in styles:
            para.space_after = self.parse_size(styles['margin-bottom'])

        if 'text-indent' in styles:
            para.first_line_indent = self.parse_size(styles['text-indent'])

        if 'margin-left' in styles or 'padding-left' in styles:
            indent_str = styles.get('margin-left') or styles.get('padding-left')
            para.left_indent = self.parse_size(indent_str)

        if 'margin-right' in styles or 'padding-right' in styles:
            indent_str = styles.get('margin-right') or styles.get('padding-right')
            para.right_indent = self.parse_size(indent_str)

        return para

    def parse_page_setup(self, attrs: Dict[str, str]) -> PageSetup:
        """Parse page-setup element attributes to PageSetup."""
        setup = PageSetup()

        if 'margin-top' in attrs:
            setup.margin_top = self.parse_inches(attrs['margin-top'])
        if 'margin-bottom' in attrs:
            setup.margin_bottom = self.parse_inches(attrs['margin-bottom'])
        if 'margin-left' in attrs:
            setup.margin_left = self.parse_inches(attrs['margin-left'])
        if 'margin-right' in attrs:
            setup.margin_right = self.parse_inches(attrs['margin-right'])
        if 'page-width' in attrs:
            setup.page_width = self.parse_inches(attrs['page-width'])
        if 'page-height' in attrs:
            setup.page_height = self.parse_inches(attrs['page-height'])

        return setup

    def apply_font_style(self, run, font_style: FontStyle):
        """Apply FontStyle to a python-docx Run."""
        if font_style.name:
            run.font.name = font_style.name
        if font_style.size:
            run.font.size = font_style.size
        if font_style.bold is not None:
            run.font.bold = font_style.bold
        if font_style.italic is not None:
            run.font.italic = font_style.italic
        if font_style.underline is not None:
            run.font.underline = font_style.underline
        if font_style.strike is not None:
            run.font.strike = font_style.strike
        if font_style.color:
            run.font.color.rgb = font_style.color

    def apply_paragraph_style(self, paragraph, para_style: ParagraphStyle):
        """Apply ParagraphStyle to a python-docx Paragraph."""
        if para_style.alignment:
            paragraph.alignment = para_style.alignment
        if para_style.line_spacing:
            paragraph.paragraph_format.line_spacing = para_style.line_spacing
        if para_style.space_before:
            paragraph.paragraph_format.space_before = para_style.space_before
        if para_style.space_after:
            paragraph.paragraph_format.space_after = para_style.space_after
        if para_style.first_line_indent:
            paragraph.paragraph_format.first_line_indent = para_style.first_line_indent
        if para_style.left_indent:
            paragraph.paragraph_format.left_indent = para_style.left_indent
        if para_style.right_indent:
            paragraph.paragraph_format.right_indent = para_style.right_indent

    def apply_page_setup(self, section, page_setup: PageSetup):
        """Apply PageSetup to a python-docx Section."""
        if page_setup.margin_top:
            section.top_margin = page_setup.margin_top
        if page_setup.margin_bottom:
            section.bottom_margin = page_setup.margin_bottom
        if page_setup.margin_left:
            section.left_margin = page_setup.margin_left
        if page_setup.margin_right:
            section.right_margin = page_setup.margin_right
        if page_setup.page_width:
            section.page_width = page_setup.page_width
        if page_setup.page_height:
            section.page_height = page_setup.page_height

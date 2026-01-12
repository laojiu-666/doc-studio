/**
 * Selector parser for AI edit operations.
 * Parses CSS-like selectors and applies edit operations to HTML content.
 */

export type EditAction = 'replace' | 'insert-before' | 'insert-after' | 'delete' | 'update-style';

export interface EditOperation {
  selector: string;
  action: EditAction;
  content?: string;
  style?: Record<string, string>;
}

export interface ParsedSelector {
  tagName: string;
  nthOfType?: number;
  firstOfType?: boolean;
  lastOfType?: boolean;
  contains?: string;
  parent?: ParsedSelector;
}

/**
 * Parse edit operations from AI response.
 * Expected format:
 * <edit selector="p:nth-of-type(3)" action="replace">new content</edit>
 * <edit selector="h2:contains('Title')" action="update-style">{"color": "#333"}</edit>
 * <edit selector="table:first-of-type tr:nth-child(2)" action="delete" />
 */
export function parseEditOperations(aiResponse: string): EditOperation[] {
  const operations: EditOperation[] = [];

  // Match <edit> tags
  const editRegex = /<edit\s+([^>]+)>([\s\S]*?)<\/edit>|<edit\s+([^>]+)\s*\/>/g;
  let match;

  while ((match = editRegex.exec(aiResponse)) !== null) {
    const attrs = match[1] || match[3];
    const content = match[2]?.trim() || '';

    // Parse attributes
    const selectorMatch = attrs.match(/selector=["']([^"']+)["']/);
    const actionMatch = attrs.match(/action=["']([^"']+)["']/);

    if (selectorMatch && actionMatch) {
      const action = actionMatch[1] as EditAction;
      const operation: EditOperation = {
        selector: selectorMatch[1],
        action,
      };

      if (action === 'update-style' && content) {
        try {
          operation.style = JSON.parse(content);
        } catch {
          // Invalid JSON, skip style
        }
      } else if (content) {
        operation.content = content;
      }

      operations.push(operation);
    }
  }

  return operations;
}

/**
 * Parse a CSS-like selector string.
 */
export function parseSelector(selector: string): ParsedSelector | null {
  // Handle compound selectors (e.g., "table tr td")
  const parts = selector.trim().split(/\s+/);

  if (parts.length === 0) return null;

  let current: ParsedSelector | null = null;

  for (const part of parts) {
    const parsed = parseSingleSelector(part);
    if (!parsed) return null;

    if (current) {
      parsed.parent = current;
    }
    current = parsed;
  }

  return current;
}

/**
 * Parse a single selector part.
 */
function parseSingleSelector(selector: string): ParsedSelector | null {
  // Extract tag name
  const tagMatch = selector.match(/^([a-z][a-z0-9]*)/i);
  if (!tagMatch) return null;

  const result: ParsedSelector = {
    tagName: tagMatch[1].toLowerCase(),
  };

  // Parse pseudo-selectors
  const nthMatch = selector.match(/:nth-of-type\((\d+)\)/);
  if (nthMatch) {
    result.nthOfType = parseInt(nthMatch[1], 10);
  }

  const nthChildMatch = selector.match(/:nth-child\((\d+)\)/);
  if (nthChildMatch) {
    result.nthOfType = parseInt(nthChildMatch[1], 10);
  }

  if (selector.includes(':first-of-type') || selector.includes(':first-child')) {
    result.firstOfType = true;
  }

  if (selector.includes(':last-of-type') || selector.includes(':last-child')) {
    result.lastOfType = true;
  }

  // Parse :contains()
  const containsMatch = selector.match(/:contains\(['"]([^'"]+)['"]\)/);
  if (containsMatch) {
    result.contains = containsMatch[1];
  }

  return result;
}

/**
 * Find element in HTML string by selector.
 * Returns the index range [start, end] of the matched element.
 */
export function findElementBySelector(
  html: string,
  selector: string
): { start: number; end: number; element: string } | null {
  const parsed = parseSelector(selector);
  if (!parsed) return null;

  // Build regex to find elements
  const tagName = parsed.tagName;
  const openTagRegex = new RegExp(`<${tagName}[^>]*>`, 'gi');
  const closeTagRegex = new RegExp(`</${tagName}>`, 'gi');

  // Find all matching elements
  const elements: { start: number; end: number; content: string }[] = [];
  let match;

  while ((match = openTagRegex.exec(html)) !== null) {
    const startIndex = match.index;
    const openTag = match[0];

    // Find matching close tag (handle nesting)
    let depth = 1;
    let searchIndex = startIndex + openTag.length;
    let endIndex = -1;

    // Check for self-closing tag
    if (openTag.endsWith('/>')) {
      endIndex = startIndex + openTag.length;
    } else {
      while (depth > 0 && searchIndex < html.length) {
        const nextOpen = html.indexOf(`<${tagName}`, searchIndex);
        const nextClose = html.indexOf(`</${tagName}>`, searchIndex);

        if (nextClose === -1) break;

        if (nextOpen !== -1 && nextOpen < nextClose) {
          // Check if it's actually an opening tag
          const potentialTag = html.slice(nextOpen, html.indexOf('>', nextOpen) + 1);
          if (!potentialTag.endsWith('/>')) {
            depth++;
          }
          searchIndex = nextOpen + 1;
        } else {
          depth--;
          if (depth === 0) {
            endIndex = nextClose + `</${tagName}>`.length;
          }
          searchIndex = nextClose + 1;
        }
      }
    }

    if (endIndex !== -1) {
      elements.push({
        start: startIndex,
        end: endIndex,
        content: html.slice(startIndex, endIndex),
      });
    }
  }

  // Apply filters
  let filtered = elements;

  // Filter by :contains()
  if (parsed.contains) {
    filtered = filtered.filter(el => el.content.includes(parsed.contains!));
  }

  // Apply position selectors
  if (parsed.firstOfType) {
    filtered = filtered.slice(0, 1);
  } else if (parsed.lastOfType) {
    filtered = filtered.slice(-1);
  } else if (parsed.nthOfType) {
    const index = parsed.nthOfType - 1; // Convert to 0-based
    filtered = index >= 0 && index < filtered.length ? [filtered[index]] : [];
  }

  if (filtered.length === 0) return null;

  const result = filtered[0];
  return {
    start: result.start,
    end: result.end,
    element: result.content,
  };
}

/**
 * Apply an edit operation to HTML content.
 */
export function applyEditOperation(html: string, operation: EditOperation): string {
  const found = findElementBySelector(html, operation.selector);

  if (!found) {
    console.warn(`Selector not found: ${operation.selector}`);
    return html;
  }

  switch (operation.action) {
    case 'replace':
      return html.slice(0, found.start) + (operation.content || '') + html.slice(found.end);

    case 'insert-before':
      return html.slice(0, found.start) + (operation.content || '') + html.slice(found.start);

    case 'insert-after':
      return html.slice(0, found.end) + (operation.content || '') + html.slice(found.end);

    case 'delete':
      return html.slice(0, found.start) + html.slice(found.end);

    case 'update-style':
      if (operation.style) {
        return applyStyleToElement(html, found, operation.style);
      }
      return html;

    default:
      return html;
  }
}

/**
 * Apply style updates to an element.
 */
function applyStyleToElement(
  html: string,
  found: { start: number; end: number; element: string },
  style: Record<string, string>
): string {
  const element = found.element;

  // Find the opening tag
  const openTagEnd = element.indexOf('>');
  if (openTagEnd === -1) return html;

  const openTag = element.slice(0, openTagEnd + 1);

  // Parse existing style
  const styleMatch = openTag.match(/style=["']([^"']*)["']/);
  const existingStyles: Record<string, string> = {};

  if (styleMatch) {
    styleMatch[1].split(';').forEach(item => {
      const [key, value] = item.split(':').map(s => s.trim());
      if (key && value) {
        existingStyles[key] = value;
      }
    });
  }

  // Merge styles
  const mergedStyles = { ...existingStyles, ...style };
  const styleString = Object.entries(mergedStyles)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');

  // Build new opening tag
  let newOpenTag: string;
  if (styleMatch) {
    newOpenTag = openTag.replace(/style=["'][^"']*["']/, `style="${styleString}"`);
  } else {
    // Insert style attribute before closing >
    const insertPos = openTag.length - 1;
    newOpenTag = openTag.slice(0, insertPos) + ` style="${styleString}"` + openTag.slice(insertPos);
  }

  // Replace in HTML
  const newElement = newOpenTag + element.slice(openTagEnd + 1);
  return html.slice(0, found.start) + newElement + html.slice(found.end);
}

/**
 * Apply multiple edit operations to HTML content.
 * Operations are applied in reverse order to preserve indices.
 */
export function applyEditOperations(html: string, operations: EditOperation[]): string {
  // Sort operations by their target position (descending) to apply from end to start
  const sortedOps = [...operations].sort((a, b) => {
    const posA = findElementBySelector(html, a.selector)?.start ?? 0;
    const posB = findElementBySelector(html, b.selector)?.start ?? 0;
    return posB - posA;
  });

  let result = html;
  for (const op of sortedOps) {
    result = applyEditOperation(result, op);
  }

  return result;
}

/**
 * Check if AI response contains edit operations.
 */
export function hasEditOperations(aiResponse: string): boolean {
  return /<edit\s+[^>]+/.test(aiResponse);
}

/**
 * Extract plain text explanation from AI response (excluding edit tags).
 */
export function extractExplanation(aiResponse: string): string {
  return aiResponse
    .replace(/<edit\s+[^>]+>[\s\S]*?<\/edit>/g, '')
    .replace(/<edit\s+[^>]+\s*\/>/g, '')
    .trim();
}

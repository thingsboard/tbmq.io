"""Generate the TBMQ configuration reference pages from the broker YAML.

Ported from thingsboard.io/scripts/generate_config_pages.py, which dropped its
tbmq/tbmq-pe repo types when the TBMQ docs moved to this site. Differences from
upstream: TBMQ-only repo types, output paths without the `mqtt-broker/` segment,
no <Banner> component (this site has none) and existing `title:`/`description:`
frontmatter is preserved across regeneration.

Usage:
    python3 scripts/generate_config_pages.py <repo_type> <branch>

    python3 scripts/generate_config_pages.py tbmq develop/2.4
    python3 scripts/generate_config_pages.py tbmq-pe license-2.4

Reads the YAML from GitHub via `gh api`, not from a local checkout, so an
authenticated `gh` session is required (tbmq-pe is private).
"""

import re
import shutil
import subprocess
import sys
import os


# repo_type -> GitHub <owner>/<repo>. tbmq-pe is private; fetching relies on
# the caller's `gh auth login` session.
REPOS = {
    'tbmq': 'thingsboard/tbmq',
    'tbmq-pe': 'thingsboard/tbmq-pe',
}

# Environment variables present in the YAML that must never reach the public
# docs. These are test seams, not supported tuning knobs — documenting one
# invites operators to set it in production.
EXCLUDED_ENV_VARS = {
    'MQTT_TOTAL_RATE_LIMITS_REFILL_PERIOD_SECONDS',
}

def fetch_file(repo, branch, path):
    """Fetch a single raw file from GitHub via the `gh` CLI.

    Uses the GitHub contents API with the raw media type so it works for both
    public and private repos, authenticating through the user's `gh` session.
    """
    if shutil.which('gh') is None:
        sys.exit("Error: the 'gh' CLI is required but was not found on PATH. "
                 "Install it and run 'gh auth login'.")
    api_path = f'repos/{repo}/contents/{path}?ref={branch}'
    result = subprocess.run(
        ['gh', 'api', api_path, '-H', 'Accept: application/vnd.github.raw'],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        sys.exit(f"Error: failed to fetch '{path}' from {repo}@{branch}.\n"
                 f"{result.stderr.strip()}")
    return result.stdout


def extract_properties_with_comments(text):
    properties = {}

    lines = text.splitlines(keepends=True)
    index = 0
    key_level_map = {0: ''}
    parse_line('', '', '', key_level_map, 0, index, lines, properties)

    return properties


def parse_line(table_name, table_description, comment, key_level_map, parent_line_level, index, lines, properties, has_section_properties=False, after_empty_comment=False):
    if index >= len(lines):
        return
    line = lines[index]
    line_level = (len(line) - len(line.lstrip())) if line.strip() else 0
    line = line.strip()
    # if line is empty - parse next line
    if not line:
        index = index + 1
        parse_line(table_name, table_description, comment, key_level_map, line_level, index, lines, properties, has_section_properties, after_empty_comment)
    # if line is a comment - save comment and parse next line
    else:
        if line_level == 0:
            key_level_map = {0: ''}
        if line.startswith('#'):
            if line_level == 0:
                comment_text = line.lstrip('#')
                if not comment_text.strip():
                    # Empty '#' line — next level-0 comment must start a new section
                    index = index + 1
                    parse_line(table_name, table_description, comment, key_level_map, line_level, index, lines, properties, has_section_properties, after_empty_comment=True)
                    return
                if comment_text[:2].isspace():
                    # Commented-out YAML written at column 0, e.g.
                    #     consumer-properties-per-topic:
                    #       tbmq.msg.app.test_client:
                    # #        - key: max.poll.records
                    # Prose section comments use a single space after '#', so deeper
                    # indentation means this is example config, not a section heading.
                    # Skip it without disturbing the current section.
                    index = index + 1
                    parse_line(table_name, table_description, comment, key_level_map, parent_line_level, index, lines, properties, has_section_properties, after_empty_comment)
                    return
                if has_section_properties or after_empty_comment:
                    # Properties already seen or preceded by an empty comment line —
                    # this comment starts a new section
                    table_name = comment_text
                    table_description = ''
                    has_section_properties = False
                elif table_name:
                    # Name set, no properties yet — append to the description (preserving line breaks)
                    table_description = (table_description + '\n' + comment_text) if table_description else comment_text
                else:
                    # Nothing set yet — this line is the section name
                    table_name = comment_text
                after_empty_comment = False
            elif line_level == parent_line_level:
                comment = comment + '\n' + line.lstrip('#') if comment else line.lstrip('#')
            else:
                comment = line.lstrip('#')
            index = index + 1
            parse_line(table_name, table_description, comment, key_level_map, line_level, index, lines, properties, has_section_properties, after_empty_comment=False)
        else:
            # Check if it's a property line
            if ':' in line:
                # clean comment if level was changed
                if line_level != parent_line_level:
                    comment = ''
                key, value = line.split(':', 1)
                if key.startswith('- '):
                    key = key.lstrip('- ')
                key_level_map[line_level] = key
                value = value.strip()
                if value.split('#')[0]:
                    current_key = ''
                    for k in key_level_map.keys():
                        if k <= line_level:
                            current_key = ((current_key + '.') if current_key else '') + key_level_map[k]
                    properties[current_key] = (value, comment, table_name, table_description)
                    comment = ''
                    has_section_properties = True
                index = index + 1
                parse_line(table_name, table_description, comment, key_level_map, line_level, index, lines, properties, has_section_properties)


def extract_property_info(properties):
    rows = []
    for property_name, value in properties.items():
        if '#' in value[0]:
            value_parts = value[0].split('#')
            comment = value_parts[1]
        else:
            comment = value[1]
        pattern = r'\"\$\{(.*?)\:(.*?)\}\"'
        match = re.match(pattern, value[0])
        table_description = value[3]
        if match is not None:
            rows.append((property_name, match.group(1), match.group(2), comment, value[2], table_description))
        else:
            rows.append((property_name, "", value[0].split('#')[0], comment, value[2], table_description))
    return rows


# `a` is included so links written in the YAML comments render as links rather
# than as escaped literal markup. A preserved tag keeps its href verbatim, which
# also spares the URL from the plain-text URL neutralisation below.
_HTML_TAG_RE = re.compile(
    r'(</?(?:ul|ol|li|br|p|b|strong|em|i|a)(?:\s[^>]*)?>)',
    re.IGNORECASE,
)

_URL_RE = re.compile(r'https?://[^\s<>"\'()\[\]]+')

# Inline code spans are literal in both markdown and MDX, so nothing inside one
# needs escaping — and an entity written there renders as its own source text
# (`&#95;` instead of `_`). Split them out and pass them through verbatim.
_CODE_SPAN_RE = re.compile(r'(`+[^`]*`+)')


def _escape_mdx(text):
    # Backslash last: it emits an entity, and the '&' pass has already run.
    # A literal backslash matters here — YAML comments use it to escape
    # semicolons in key:value;key:value settings (sasl.jaas.config) — and MDX
    # would otherwise read '\\;' as a markdown escape and drop the backslash.
    return (
        text.replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
        .replace('{', '&#123;')
        .replace('}', '&#125;')
        .replace('_', '&#95;')
        .replace('*', '&#42;')
        .replace('\\', '&#92;')
    )


def _escape_plain_text(text):
    # Escape MDX-special characters, but wrap any http(s):// URLs as {'...'}
    # JSX string expressions so MDX does not auto-link them.
    result = []
    last_end = 0
    for m in _URL_RE.finditer(text):
        url = m.group(0)
        # Drop trailing punctuation that is likely sentence-level, not part of the URL
        while url and url[-1] in '.,;:!?':
            url = url[:-1]
        if not url:
            continue
        start = m.start()
        end = start + len(url)
        result.append(_escape_mdx(text[last_end:start]))
        safe_url = url.replace('\\', '\\\\').replace("'", "\\'")
        result.append("{'" + safe_url + "'}")
        last_end = end
    result.append(_escape_mdx(text[last_end:]))
    return ''.join(result)


def escape_cell(text):
    text = str(text).replace('\n', ' ').strip()
    # Normalize <br> to JSX-compatible self-closing form
    text = re.sub(r'<br\s*/?>', '<br />', text, flags=re.IGNORECASE)
    # Split on known safe HTML tags; preserve them, escape everything else
    parts = _HTML_TAG_RE.split(text)
    result = []
    for i, part in enumerate(parts):
        if i % 2 == 1:  # captured HTML tag — preserve as-is
            result.append(part)
        else:            # plain text — escape MDX-special characters + neutralize URLs,
                         # but pass inline code spans through untouched
            for j, seg in enumerate(_CODE_SPAN_RE.split(part)):
                result.append(seg if j % 2 else _escape_plain_text(seg))
    return ''.join(result)


def generate_section(table_name, rows):
    if not any(row[1] for row in rows):
        return ''
    html = f'## {table_name.strip()}\n\n'
    table_description = rows[0][5].strip() if rows and len(rows[0]) > 5 else ''
    if table_description:
        # Upstream renders this as <Banner>; this site has no such component,
        # so the section description becomes a plain paragraph.
        table_description = table_description.replace('\n', '<br />')
        html += f'{escape_cell(table_description)}\n\n'
    html += '<div class="config-def-list">\n'
    for row in rows:
        if row[1] in EXCLUDED_ENV_VARS:
            continue
        _, env_var, default_val, description = [escape_cell(c) for c in row[:4]]
        if not env_var:
            continue
        html += '  <div class="config-def-item">\n'
        meta_parts = []
        if env_var:
            meta_parts.append(f'<code class="config-def-env">{env_var}</code>')
        if default_val:
            meta_parts.append(f'<span class="config-def-label">Default</span> <code>{default_val}</code>')
        if meta_parts:
            html += f'    <p class="config-def-meta">{" · ".join(meta_parts)}</p>\n'
        if description:
            html += f'    <p class="config-def-desc">{description}</p>\n'
        html += '  </div>\n'
    html += '</div>\n'
    return html


def group_properties_by_table(data):
    property_groups = {}

    for row in data:
        table_name = row[4]

        if table_name not in property_groups:
            property_groups[table_name] = []

        property_groups[table_name].append(row)

    return property_groups


def _find_section(key, default_props):
    """Find the (table_name, table_description) for a key by checking ancestors then siblings in default_props."""
    parts = key.split('.')
    # Walk up the key hierarchy looking for a direct match
    for length in range(len(parts), 0, -1):
        prefix = '.'.join(parts[:length])
        if prefix in default_props:
            return default_props[prefix][2], default_props[prefix][3]
    # Fall back to any sibling under the same parent prefix
    for length in range(len(parts) - 1, 0, -1):
        prefix = '.'.join(parts[:length]) + '.'
        for k, v in default_props.items():
            if k.startswith(prefix):
                return v[2], v[3]
    return '', ''



def _read_existing_frontmatter(output_file):
    """Return existing 'title:' and 'description:' frontmatter lines, if any.

    Both are hand-curated (the titles here are sentence case, which the
    generator cannot derive from the YAML), so they must survive regeneration.
    """
    keep = {}
    if not os.path.exists(output_file):
        return keep
    with open(output_file, 'r') as f:
        lines = f.readlines()
    if not lines or lines[0].strip() != '---':
        return keep
    for line in lines[1:]:
        if line.strip() == '---':
            break
        for key in ('title:', 'description:'):
            if line.startswith(key):
                keep[key] = line.rstrip('\n')
    return keep


def write_page(output_file, sidebar_label, content):
    """Write the generated page, preserving hand-curated frontmatter."""
    keep = _read_existing_frontmatter(output_file)
    front = '---\n'
    front += keep.get('title:', f'title: {sidebar_label} configuration') + '\n'
    if 'description:' in keep:
        front += keep['description:'] + '\n'
    front += f'sidebar:\n  label: {sidebar_label}\n---\n\n\n'

    os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
    with open(output_file, 'w') as f:
        f.write(front)
        f.write(content)


def update_page(repo, branch, input_path, output_file, sidebar_label):
    text = fetch_file(repo, branch, input_path)
    properties = extract_properties_with_comments(text)
    property_info = extract_property_info(properties)
    property_groups = group_properties_by_table(property_info)

    content = ''
    for group in property_groups:
        section = generate_section(group, property_groups[group])
        if section:
            content += section + '\n'

    write_page(output_file, sidebar_label, content)
    print(f"Generated {output_file} from {repo}@{branch}/{input_path}")


PAGES = {
    'tbmq': [
        ('yml', 'application/src/main/resources/thingsboard-mqtt-broker.yml',
         'src/content/docs/docs/installation/config.mdx', 'TBMQ'),
        ('yml', 'integration/executor/src/main/resources/tbmq-integration-executor.yml',
         'src/content/docs/docs/installation/ie-config.mdx', 'Integration Executor'),
    ],
    'tbmq-pe': [
        ('yml', 'application/src/main/resources/thingsboard-mqtt-broker.yml',
         'src/content/docs/docs/pe/installation/config.mdx', 'TBMQ'),
        ('yml', 'integration/executor/src/main/resources/tbmq-integration-executor.yml',
         'src/content/docs/docs/pe/installation/ie-config.mdx', 'Integration Executor'),
    ],
}


if __name__ == '__main__':
    sys.setrecursionlimit(10000)
    if len(sys.argv) != 3:
        sys.exit("Usage: generate_config_pages.py <repo_type> <branch>\n"
                 "  <repo_type>: " + ", ".join(REPOS.keys()))

    repo_type = sys.argv[1].lower()
    branch = sys.argv[2]

    if repo_type not in REPOS:
        sys.exit(f"Invalid 'repo_type' '{repo_type}'. "
                 f"Choose one of: {', '.join(REPOS.keys())}.")

    repo = REPOS[repo_type]
    for _kind, src, output_file, label in PAGES[repo_type]:
        update_page(repo, branch, src, output_file, label)

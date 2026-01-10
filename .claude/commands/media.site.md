---
description: Manage Jekyll site structure, templates, styling, and content publishing.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Overview

The Site Specialist manages static site infrastructure:
- Jekyll site structure and configuration
- Page templates and layouts
- Styling and theming
- Content publishing and organization
- Asset management

## Site Architecture

### Standard Jekyll Directory Structure

```
├── _config.yml         # Site configuration
├── _posts/             # Blog content (YYYY-MM-DD-title.md)
├── _drafts/            # Unpublished posts
├── _layouts/           # Page templates
│   ├── default.html    # Base layout
│   ├── post.html       # Blog post layout
│   └── page.html       # Static page layout
├── _includes/          # Reusable components
│   ├── header.html
│   ├── footer.html
│   └── nav.html
├── _sass/              # Stylesheets
│   ├── _base.scss
│   ├── _layout.scss
│   └── _components.scss
├── assets/
│   ├── css/
│   ├── images/
│   └── js/
├── _data/              # Data files (YAML, JSON)
└── pages/              # Static pages
```

## Content Front Matter

### Blog Posts

Required front matter for posts:

```yaml
---
layout: post
title: "Post Title Here"
date: YYYY-MM-DD HH:MM:SS +0000
author: Author Name
category: planning|shipped|tutorial|announcement
tags: [tag1, tag2, tag3]
excerpt: "Brief description for listings and social sharing"
image: /assets/images/post-hero.png  # Optional hero image
discussion_url: https://github.com/org/repo/discussions/123  # Optional
---
```

### Static Pages

```yaml
---
layout: page
title: "Page Title"
permalink: /page-slug/
nav_order: 1  # For navigation ordering
---
```

## Site Tasks

### Creating a New Blog Post

1. **Generate filename**: `_posts/YYYY-MM-DD-slug-title.md`
2. **Add front matter** with all required fields
3. **Write content** using provided copy
4. **Add images** to `assets/images/posts/YYYY-MM/`
5. **Verify** markdown renders correctly

### Adding a New Page

1. **Create file** in `pages/` or root directory
2. **Set permalink** in front matter
3. **Update navigation** in `_data/navigation.yml` if needed
4. **Add to sitemap** if not auto-generated

### Updating Site Styling

1. **Locate** appropriate SCSS file in `_sass/`
2. **Make changes** following existing conventions
3. **Test** across breakpoints (mobile, tablet, desktop)
4. **Verify** no regressions in existing pages

### Managing Assets

**Images**:
- Store in `assets/images/` with organized subdirectories
- Use descriptive filenames: `feature-name-screenshot-01.png`
- Optimize for web (compress, appropriate dimensions)
- Always include alt text in markdown

**Downloads**:
- Store in `assets/downloads/`
- Version files when appropriate

## Publishing Workflow

### Draft to Published

1. Create post in `_drafts/` (no date prefix needed)
2. Preview with `bundle exec jekyll serve --drafts`
3. When ready, move to `_posts/` with date prefix
4. Commit and push

### Scheduling Posts

For future-dated posts:
1. Set `date` in front matter to future date
2. Build with `--future` flag for preview
3. Post will appear when date arrives (with proper CI/CD)

## Configuration Reference

### Key `_config.yml` Settings

```yaml
title: Site Title
description: Site description for SEO
url: https://example.github.io
baseurl: /repo-name  # If hosted at subdirectory

# Build settings
markdown: kramdown
highlighter: rouge

# Collections (if using)
collections:
  docs:
    output: true
    permalink: /docs/:path/

# Defaults
defaults:
  - scope:
      path: "_posts"
      type: posts
    values:
      layout: post
      author: Default Author
```

## Output Format

### For New Content

```markdown
## Site Update Complete

### Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `_posts/2024-01-15-feature-name.md` | Created | New blog post |
| `assets/images/posts/2024-01/hero.png` | Added | Post hero image |

### Front Matter Used

\`\`\`yaml
---
layout: post
title: "..."
date: ...
---
\`\`\`

### Verification Steps
- [ ] Preview locally with `bundle exec jekyll serve`
- [ ] Check responsive layout
- [ ] Verify images load correctly
- [ ] Test internal links
```

### For Site Updates

```markdown
## Site Structure Update

### Changes Made
1. **[Component/file]**: [What changed]
2. **[Component/file]**: [What changed]

### Files Modified
- `path/to/file.html`
- `path/to/style.scss`

### Testing Required
- [ ] [Specific page/feature to test]
- [ ] [Browser/device to verify]
```

## Quick Reference

| Task | Primary File | Related Files |
|------|--------------|---------------|
| New blog post | `_posts/` | `assets/images/` |
| New page | `pages/` | `_data/navigation.yml` |
| Update header | `_includes/header.html` | `_sass/_components.scss` |
| Change colors | `_sass/_variables.scss` | - |
| Add navigation | `_data/navigation.yml` | `_includes/nav.html` |

# Language Guide

## Adding/Updating Translations

### Adding a New Language

To add a new language translation to HabitTrove:

1. **Create translation file**: 
   - Copy `messages/en.json` as a template
   - Save as `messages/{language-code}.json` (e.g., `ko.json` for Korean)
   - Translate all values while preserving keys and placeholder variables like `{username}`, `{count}`, etc.

2. **Validate translation structure**:
   ```bash
   # Ensure JSON is valid
   jq empty messages/{language-code}.json
   
   # Compare structure with English (should show no differences)
   diff <(jq -S . messages/en.json | jq -r 'keys | sort | .[]') <(jq -S . messages/{language-code}.json | jq -r 'keys | sort | .[]')
   ```

3. **Add language option to UI**:
   - Edit `app/settings/page.tsx`
   - Add new `<option value="{language-code}">{Language Name}</option>` in alphabetical order

4. **Update documentation**:
   - Add language to README.md supported languages list
   - Create new changelog entry with version bump
   - Update package.json version

### Example: Adding Korean (한국어)

```bash
# 1. Copy translation file
cp /path/to/ko.json messages/ko.json

# 2. Add to settings page
# Add: <option value="ko">한국어</option>

# 3. Update README.md
# Change: 简体中文, 日본語
# To: 简체中文, 한국어, 日본語

# 4. Add changelog entry
# Create new version section with language addition

# 5. Bump package version
# Update version in package.json
```

### Translation Quality Guidelines

- Use natural, contextually appropriate expressions
- Maintain consistent terminology throughout
- Preserve all placeholder variables exactly: `{username}`, `{count}`, `{target}`, etc.
- Use appropriate formality level for the target language
- Ensure JSON structure matches English file exactly (385 total keys)

### Validation Commands

```bash
# Check JSON validity
jq empty messages/{lang}.json

# Compare key structure
node -e "
const en = require('./messages/en.json');
const target = require('./messages/{lang}.json');
// ... deep key comparison script
"

# Verify placeholder consistency
grep -o '{[^}]*}' messages/en.json | sort | uniq > en_vars.txt
grep -o '{[^}]*}' messages/{lang}.json | sort | uniq > {lang}_vars.txt
diff en_vars.txt {lang}_vars.txt
```

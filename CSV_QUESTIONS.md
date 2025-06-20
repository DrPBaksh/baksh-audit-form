# CSV Questions Configuration

## Updating Survey Questions

**Yes, questions will automatically update when you modify the CSV files.**

### How it works:

1. **Edit CSV files** in the `/data/` directory:
   - `company_questions.csv` - Company assessment questions
   - `employee_questions.csv` - Employee assessment questions

2. **Redeploy backend** to upload the updated questions:
   ```bash
   cd backend
   ./deploy.sh --owner=your-name
   ```

3. **Questions are served dynamically** from S3, so changes take effect immediately after deployment.

### CSV File Format:

Both CSV files should follow this structure:
```csv
id,question,type,required,options,section
1,"What is your company size?",select,true,"1-10,11-50,51-200,200+",Company Info
2,"Describe your AI strategy",textarea,true,,Strategy
```

### Column Definitions:
- **id**: Unique identifier for the question
- **question**: The question text displayed to users  
- **type**: Question type (text, textarea, select, checkbox, radio)
- **required**: true/false - whether the question is mandatory
- **options**: Comma-separated options for select/radio/checkbox types
- **section**: Grouping category for the question

### Notes:
- Questions are cached briefly in the browser, so users may need to refresh after updates
- CSV headers should match exactly as shown above
- Existing responses will not be affected by question changes
- ID changes may cause data mapping issues, so avoid changing IDs of existing questions

### British English:
The system uses British English throughout, including:
- "recognised" instead of "recognized"
- "utilisation" instead of "utilization" 
- Date formats in DD/MM/YYYY format

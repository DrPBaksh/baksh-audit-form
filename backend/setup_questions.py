#!/usr/bin/env python3
"""
Setup script to upload initial survey questions to S3
"""
import os
import sys
import boto3
import argparse
from pathlib import Path

def upload_questions(bucket_name, local_data_dir=None):
    """
    Upload question CSV files to S3 bucket
    
    Args:
        bucket_name (str): S3 bucket name
        local_data_dir (str): Local directory containing CSV files
    """
    if not local_data_dir:
        # Default to data directory relative to this script
        script_dir = Path(__file__).parent
        local_data_dir = script_dir.parent / "data"
    else:
        local_data_dir = Path(local_data_dir)
    
    if not local_data_dir.exists():
        print(f"❌ Data directory not found: {local_data_dir}")
        return False
    
    # Initialize S3 client
    try:
        s3_client = boto3.client('s3')
        print(f"✅ Connected to AWS S3")
    except Exception as e:
        print(f"❌ Failed to connect to AWS: {e}")
        return False
    
    # Check if bucket exists
    try:
        s3_client.head_bucket(Bucket=bucket_name)
        print(f"✅ Bucket exists: {bucket_name}")
    except Exception as e:
        print(f"❌ Bucket not accessible: {bucket_name} - {e}")
        return False
    
    # Upload question files
    question_files = [
        ("company_questions.csv", "questions/company_questions.csv"),
        ("employee_questions.csv", "questions/employee_questions.csv")
    ]
    
    success_count = 0
    
    for local_file, s3_key in question_files:
        local_path = local_data_dir / local_file
        
        if not local_path.exists():
            print(f"⚠️  File not found: {local_path}")
            continue
        
        try:
            print(f"📤 Uploading {local_file} to s3://{bucket_name}/{s3_key}")
            
            s3_client.upload_file(
                str(local_path),
                bucket_name,
                s3_key,
                ExtraArgs={
                    'ContentType': 'text/csv',
                    'ServerSideEncryption': 'AES256'
                }
            )
            
            print(f"✅ Successfully uploaded {local_file}")
            success_count += 1
            
        except Exception as e:
            print(f"❌ Failed to upload {local_file}: {e}")
    
    print(f"\n📊 Upload Summary: {success_count}/{len(question_files)} files uploaded successfully")
    return success_count == len(question_files)

def main():
    parser = argparse.ArgumentParser(description="Upload survey questions to S3 bucket")
    parser.add_argument(
        "--bucket", 
        required=True, 
        help="S3 bucket name (e.g., baksh-audit-owner-dev-survey-data)"
    )
    parser.add_argument(
        "--data-dir", 
        help="Local directory containing CSV files (default: ../data)"
    )
    parser.add_argument(
        "--dry-run", 
        action="store_true", 
        help="Show what would be uploaded without actually uploading"
    )
    
    args = parser.parse_args()
    
    print("🏢 Baksh Audit Form - Question Setup")
    print("=" * 40)
    
    if args.dry_run:
        print("🔍 DRY RUN MODE - No files will be uploaded")
        
        local_data_dir = Path(args.data_dir) if args.data_dir else Path(__file__).parent.parent / "data"
        
        question_files = ["company_questions.csv", "employee_questions.csv"]
        
        print(f"📁 Data directory: {local_data_dir}")
        print(f"🪣 Target bucket: {args.bucket}")
        print(f"📋 Files to upload:")
        
        for file_name in question_files:
            local_path = local_data_dir / file_name
            exists = "✅" if local_path.exists() else "❌"
            print(f"   {exists} {file_name} -> questions/{file_name}")
        
        return
    
    # Actual upload
    success = upload_questions(args.bucket, args.data_dir)
    
    if success:
        print("\n🎉 All questions uploaded successfully!")
        print("Your survey application is ready to use.")
    else:
        print("\n⚠️  Some uploads failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
"""
Shared S3 utilities for survey Lambda functions
"""
import boto3
import json
import csv
import io
import logging
from typing import Dict, List, Any
from botocore.exceptions import ClientError

# Set up logging
logger = logging.getLogger(__name__)

class S3Utils:
    """Utility class for S3 operations"""
    
    def __init__(self, bucket_name: str):
        self.bucket_name = bucket_name
        self.s3_client = boto3.client('s3')
    
    def read_csv_file(self, key: str) -> List[Dict[str, Any]]:
        """
        Read a CSV file from S3 and return as list of dictionaries
        
        Args:
            key: S3 object key
            
        Returns:
            List of dictionaries representing CSV rows
        """
        try:
            logger.info(f"Reading CSV file from s3://{self.bucket_name}/{key}")
            
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            content = response['Body'].read().decode('utf-8')
            
            # Parse CSV content
            csv_reader = csv.DictReader(io.StringIO(content))
            data = list(csv_reader)
            
            logger.info(f"Successfully read {len(data)} rows from CSV")
            return data
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                logger.error(f"CSV file not found: {key}")
                raise FileNotFoundError(f"Questions file not found: {key}")
            else:
                logger.error(f"Error reading CSV file {key}: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"Unexpected error reading CSV file {key}: {str(e)}")
            raise
    
    def read_json_file(self, key: str) -> Dict[str, Any]:
        """
        Read a JSON file from S3
        
        Args:
            key: S3 object key
            
        Returns:
            Dictionary representing JSON content
        """
        try:
            logger.info(f"Reading JSON file from s3://{self.bucket_name}/{key}")
            
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            content = response['Body'].read().decode('utf-8')
            data = json.loads(content)
            
            logger.info(f"Successfully read JSON file")
            return data
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                logger.info(f"JSON file not found: {key} (this is okay for new responses)")
                return {}
            else:
                logger.error(f"Error reading JSON file {key}: {str(e)}")
                raise
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in file {key}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error reading JSON file {key}: {str(e)}")
            raise
    
    def write_json_file(self, key: str, data: Dict[str, Any]) -> bool:
        """
        Write a JSON file to S3
        
        Args:
            key: S3 object key
            data: Dictionary to write as JSON
            
        Returns:
            True if successful
        """
        try:
            logger.info(f"Writing JSON file to s3://{self.bucket_name}/{key}")
            
            json_content = json.dumps(data, indent=2, default=str)
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=json_content,
                ContentType='application/json'
            )
            
            logger.info(f"Successfully wrote JSON file")
            return True
            
        except Exception as e:
            logger.error(f"Error writing JSON file {key}: {str(e)}")
            raise
    
    def upload_file(self, key: str, file_content: bytes, content_type: str = 'application/octet-stream') -> bool:
        """
        Upload a file to S3
        
        Args:
            key: S3 object key
            file_content: File content as bytes
            content_type: MIME type of the file
            
        Returns:
            True if successful
        """
        try:
            logger.info(f"Uploading file to s3://{self.bucket_name}/{key}")
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=file_content,
                ContentType=content_type
            )
            
            logger.info(f"Successfully uploaded file")
            return True
            
        except Exception as e:
            logger.error(f"Error uploading file {key}: {str(e)}")
            raise
    
    def file_exists(self, key: str) -> bool:
        """
        Check if a file exists in S3
        
        Args:
            key: S3 object key
            
        Returns:
            True if file exists, False otherwise
        """
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                return False
            else:
                raise


def lambda_response(status_code: int, body: Dict[str, Any], headers: Dict[str, str] = None) -> Dict[str, Any]:
    """
    Create a standardized Lambda response
    
    Args:
        status_code: HTTP status code
        body: Response body as dictionary
        headers: Optional additional headers
        
    Returns:
        Lambda response dictionary
    """
    default_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    }
    
    if headers:
        default_headers.update(headers)
    
    return {
        'statusCode': status_code,
        'headers': default_headers,
        'body': json.dumps(body, default=str)
    }
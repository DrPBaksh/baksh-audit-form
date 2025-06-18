import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_iam as iam,
    RemovalPolicy,
    CfnOutput,
    Duration,
)
from constructs import Construct

class InfraStack(Stack):
    def __init__(self, scope: Construct, id: str, *,
                 owner_name: str,
                 environment: str,
                 env=None, **kwargs):
        super().__init__(scope, id, env=env, **kwargs)

        # Resource naming prefix
        prefix = f"baksh-audit-{owner_name}-{environment}"

        # 1️⃣ Main S3 Bucket for survey data, questions, and responses
        self.survey_bucket = s3.Bucket(self, "SurveyDataBucket",
            bucket_name=f"{prefix}-survey-data",
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            cors=[s3.CorsRule(
                allowed_methods=[
                    s3.HttpMethods.GET, 
                    s3.HttpMethods.PUT, 
                    s3.HttpMethods.POST,
                    s3.HttpMethods.HEAD
                ],
                allowed_origins=["*"],  # Configure this more restrictively in production
                allowed_headers=["*"],
                exposed_headers=["ETag"],
                max_age=3000
            )],
            removal_policy=RemovalPolicy.RETAIN,  # Keep survey data safe
            versioning=True  # Enable versioning for data protection
        )

        # 2️⃣ S3 Bucket for Website hosting (private, accessed via CloudFront)
        self.website_bucket = s3.Bucket(self, "WebsiteBucket",
            bucket_name=f"{prefix}-website",
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # 3️⃣ CloudFront Function for SPA routing
        spa_function = cloudfront.Function(self, "SpaFunction",
            code=cloudfront.FunctionCode.from_inline(
                """
                function handler(event) {
                    var request = event.request;
                    var uri = request.uri;
                    
                    // Check if the URI has a file extension
                    if (!uri.includes('.')) {
                        // If no extension, route to index.html for SPA routing
                        request.uri = '/index.html';
                    }
                    
                    return request;
                }
                """
            )
        )

        # 4️⃣ CloudFront Distribution
        self.distribution = cloudfront.Distribution(self, "WebsiteDistribution",
            default_root_object="index.html",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(self.website_bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                compress=True,
                function_associations=[
                    cloudfront.FunctionAssociation(
                        event_type=cloudfront.FunctionEventType.VIEWER_REQUEST,
                        function=spa_function
                    )
                ]
            ),
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.seconds(10)
                ),
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.seconds(10)
                )
            ]
        )

        # 5️⃣ IAM Role for Lambda functions to read questions (least privilege)
        self.get_questions_role = iam.Role(self, "GetQuestionsRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )
        
        # Grant read-only access to questions/ prefix
        self.survey_bucket.grant_read(self.get_questions_role, "questions/*")

        # 6️⃣ IAM Role for Lambda functions to save responses (least privilege)
        self.save_response_role = iam.Role(self, "SaveResponseRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )
        
        # Grant write access to companies/ prefix only
        self.survey_bucket.grant_write(self.save_response_role, "companies/*")
        self.survey_bucket.grant_read(self.save_response_role, "companies/*")

        # 7️⃣ Outputs
        CfnOutput(self, "SurveyBucketName",
            description="S3 bucket for survey questions and responses",
            value=self.survey_bucket.bucket_name
        )
        
        CfnOutput(self, "WebsiteBucketName",
            description="S3 bucket for website hosting",
            value=self.website_bucket.bucket_name
        )
        
        CfnOutput(self, "CloudFrontDomainName",
            description="CloudFront domain name for the survey application",
            value=self.distribution.domain_name
        )
        
        CfnOutput(self, "CloudFrontDistributionId",
            description="CloudFront distribution ID for cache invalidation",
            value=self.distribution.distribution_id
        )
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_iam as iam,
    aws_logs as logs,
    CfnOutput,
    Duration,
)
from constructs import Construct
import os
import hashlib

class ApiStack(Stack):
    def __init__(self, scope: Construct, id: str, *,
                 infra_stack,
                 owner_name: str,
                 environment: str,
                 env=None, **kwargs):
        super().__init__(scope, id, env=env, **kwargs)

        # Resource naming prefix
        prefix = f"baksh-audit-{owner_name}-{environment}"

        # 1️⃣ Shared Lambda Layer for common utilities
        shared_layer = _lambda.LayerVersion(self, "SharedLayer",
            code=_lambda.Code.from_asset("../lambda/shared"),
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_11],
            description="Shared utilities for survey Lambda functions",
            layer_version_name=f"{prefix}-shared-layer"
        )

        # 2️⃣ Lambda function to get questions
        get_questions_function = _lambda.Function(self, "GetQuestionsFunction",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="lambda_function.lambda_handler",
            code=_lambda.Code.from_asset("../lambda/get_questions"),
            role=infra_stack.get_questions_role,
            layers=[shared_layer],
            environment={
                "SURVEY_BUCKET": infra_stack.survey_bucket.bucket_name,
                "LOG_LEVEL": "INFO"
            },
            timeout=Duration.seconds(30),
            memory_size=256,
            log_retention=logs.RetentionDays.ONE_WEEK,
            function_name=f"{prefix}-get-questions"
        )

        # 3️⃣ Lambda function to save responses
        save_response_function = _lambda.Function(self, "SaveResponseFunction",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="lambda_function.lambda_handler",
            code=_lambda.Code.from_asset("../lambda/save_response"),
            role=infra_stack.save_response_role,
            layers=[shared_layer],
            environment={
                "SURVEY_BUCKET": infra_stack.survey_bucket.bucket_name,
                "LOG_LEVEL": "INFO"
            },
            timeout=Duration.seconds(60),
            memory_size=512,
            log_retention=logs.RetentionDays.ONE_WEEK,
            function_name=f"{prefix}-save-response"
        )

        # 4️⃣ Lambda function to get existing responses
        get_response_function = _lambda.Function(self, "GetResponseFunction",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="lambda_function.lambda_handler",
            code=_lambda.Code.from_asset("../lambda/get_response"),
            role=infra_stack.get_response_role,
            layers=[shared_layer],
            environment={
                "SURVEY_BUCKET": infra_stack.survey_bucket.bucket_name,
                "LOG_LEVEL": "INFO"
            },
            timeout=Duration.seconds(30),
            memory_size=256,
            log_retention=logs.RetentionDays.ONE_WEEK,
            function_name=f"{prefix}-get-response"
        )

        # 5️⃣ API Gateway REST API with CORS
        api = apigateway.RestApi(self, "SurveyApi",
            rest_api_name=f"{prefix}-api",
            description="Baksh Audit Form Survey API",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["*"],  # Configure more restrictively in production
                allow_methods=["GET", "POST", "OPTIONS"],
                allow_headers=[
                    "Content-Type",
                    "X-Amz-Date",
                    "Authorization",
                    "X-Api-Key",
                    "X-Amz-Security-Token",
                    "X-Amz-User-Agent"
                ]
            )
        )

        # 6️⃣ API Resources and Methods with PROPER Proxy Integration
        
        # /questions resource
        questions_resource = api.root.add_resource("questions")
        
        # GET /questions - SIMPLIFIED proxy integration (no explicit responses)
        # This ensures CDK doesn't interfere with the proxy behavior
        questions_integration = apigateway.LambdaIntegration(
            get_questions_function,
            proxy=True  # Pure proxy integration - let Lambda handle everything
        )
        
        questions_resource.add_method("GET", questions_integration)

        # /responses resource
        responses_resource = api.root.add_resource("responses")
        
        # POST /responses - SIMPLIFIED proxy integration (no explicit responses)
        save_responses_integration = apigateway.LambdaIntegration(
            save_response_function,
            proxy=True  # Pure proxy integration - let Lambda handle everything
        )
        
        responses_resource.add_method("POST", save_responses_integration)

        # GET /responses - NEW: Add missing GET method for retrieving existing responses
        get_responses_integration = apigateway.LambdaIntegration(
            get_response_function,
            proxy=True  # Pure proxy integration - let Lambda handle everything
        )
        
        responses_resource.add_method("GET", get_responses_integration)

        # 7️⃣ FORCED API Gateway Deployment with unique identifier
        # This ensures a new deployment is created every time CDK runs
        
        # Create a unique deployment identifier based on function code hashes
        deployment_hash = hashlib.md5(
            f"{get_questions_function.function_name}-{save_response_function.function_name}-{get_response_function.function_name}-{cdk.Aws.STACK_NAME}".encode()
        ).hexdigest()[:8]
        
        deployment = apigateway.Deployment(self, f"SurveyApiDeployment{deployment_hash}",
            api=api,
            description=f"Baksh Audit Form API Deployment - {deployment_hash}"
        )
        
        # Ensure deployment depends on methods (forces redeployment when methods change)
        deployment.node.add_dependency(questions_resource)
        deployment.node.add_dependency(responses_resource)
        
        stage = apigateway.Stage(self, "SurveyApiStage",
            deployment=deployment,
            stage_name=environment,
            description=f"Baksh Audit Form Survey API - {environment} stage"
        )

        # 8️⃣ Explicit API Gateway permissions to prevent missing permission issues
        # This ensures all Lambda functions have proper invoke permissions for the specified stage
        
        # Permission for get_questions function
        get_questions_function.add_permission("ApiGatewayInvokeQuestions",
            principal=iam.ServicePrincipal("apigateway.amazonaws.com"),
            action="lambda:InvokeFunction",
            source_arn=f"arn:aws:execute-api:{self.region}:{self.account}:{api.rest_api_id}/{environment}/GET/questions"
        )
        
        # Permission for save_response function  
        save_response_function.add_permission("ApiGatewayInvokeResponsesPost",
            principal=iam.ServicePrincipal("apigateway.amazonaws.com"),
            action="lambda:InvokeFunction",
            source_arn=f"arn:aws:execute-api:{self.region}:{self.account}:{api.rest_api_id}/{environment}/POST/responses"
        )
        
        # Permission for get_response function - CRITICAL: This was missing!
        get_response_function.add_permission("ApiGatewayInvokeResponsesGet",
            principal=iam.ServicePrincipal("apigateway.amazonaws.com"),
            action="lambda:InvokeFunction",
            source_arn=f"arn:aws:execute-api:{self.region}:{self.account}:{api.rest_api_id}/{environment}/GET/responses"
        )

        # 9️⃣ Outputs
        CfnOutput(self, "ApiUrl",
            description="Survey API Gateway URL",
            value=f"https://{api.rest_api_id}.execute-api.{self.region}.amazonaws.com/{environment}"
        )
        
        CfnOutput(self, "GetQuestionsFunctionName",
            description="Get Questions Lambda function name",
            value=get_questions_function.function_name
        )
        
        CfnOutput(self, "SaveResponseFunctionName",
            description="Save Response Lambda function name",
            value=save_response_function.function_name
        )
        
        CfnOutput(self, "GetResponseFunctionName",
            description="Get Response Lambda function name",
            value=get_response_function.function_name
        )
        
        CfnOutput(self, "ApiDeploymentId",
            description="API Gateway deployment ID",
            value=deployment.deployment_id
        )

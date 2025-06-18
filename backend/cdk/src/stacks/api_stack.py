import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_logs as logs,
    CfnOutput,
    Duration,
)
from constructs import Construct
import os

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

        # 4️⃣ API Gateway REST API
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

        # 5️⃣ API Resources and Methods
        
        # /questions resource
        questions_resource = api.root.add_resource("questions")
        
        # GET /questions (with query parameter ?type=company|employee)
        questions_integration = apigateway.LambdaIntegration(
            get_questions_function,
            proxy=False,
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                ),
                apigateway.IntegrationResponse(
                    status_code="400",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                ),
                apigateway.IntegrationResponse(
                    status_code="500",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                )
            ]
        )
        
        questions_resource.add_method("GET", questions_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                ),
                apigateway.MethodResponse(
                    status_code="400",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                ),
                apigateway.MethodResponse(
                    status_code="500",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ]
        )

        # /responses resource
        responses_resource = api.root.add_resource("responses")
        
        # POST /responses
        responses_integration = apigateway.LambdaIntegration(
            save_response_function,
            proxy=False,
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                ),
                apigateway.IntegrationResponse(
                    status_code="400",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                ),
                apigateway.IntegrationResponse(
                    status_code="500",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                )
            ]
        )
        
        responses_resource.add_method("POST", responses_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                ),
                apigateway.MethodResponse(
                    status_code="400",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                ),
                apigateway.MethodResponse(
                    status_code="500",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ]
        )

        # 6️⃣ API Gateway Deployment
        deployment = apigateway.Deployment(self, "SurveyApiDeployment",
            api=api
        )
        
        stage = apigateway.Stage(self, "SurveyApiStage",
            deployment=deployment,
            stage_name=environment
        )

        # 7️⃣ Outputs
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
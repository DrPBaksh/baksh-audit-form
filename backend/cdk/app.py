#!/usr/bin/env python3
import os
import aws_cdk as cdk
from src.stacks.infra_stack import InfraStack
from src.stacks.api_stack import ApiStack

app = cdk.App()

# Get the owner name from context or use default
owner_name = app.node.try_get_context('owner_name') or "default"
environment = app.node.try_get_context('environment') or "dev"

# Stack naming with environment support
stack_prefix = f"baksh-audit-{owner_name}-{environment}"

# Create the infrastructure stack
infra_stack = InfraStack(
    app, 
    f"{stack_prefix}-Infra",
    owner_name=owner_name,
    environment=environment,
    env=cdk.Environment(
        account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
        region=os.environ.get("CDK_DEFAULT_REGION", "eu-west-2")
    )
)

# Create the API stack with dependency on infrastructure
api_stack = ApiStack(
    app, 
    f"{stack_prefix}-Api",
    infra_stack=infra_stack,
    owner_name=owner_name,
    environment=environment,
    env=cdk.Environment(
        account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
        region=os.environ.get("CDK_DEFAULT_REGION", "eu-west-2")
    )
)

# Add dependency to ensure infra is deployed before API
api_stack.add_dependency(infra_stack)

app.synth()
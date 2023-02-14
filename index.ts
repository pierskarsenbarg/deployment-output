import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const role = new aws.iam.Role("role", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal(aws.iam.Principals.LambdaPrincipal),
    managedPolicyArns: [aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole]
});

const fn = new aws.lambda.CallbackFunction("fn", {
    callback: async () => {
        return {
            statusCode: 200,
            body: JSON.stringify({"message": "Hello, World!"})
        }
    },
    role: role,
})

const api = new aws.apigateway.RestApi("api");

const resource = new aws.apigateway.Resource("resource", {
    parentId: api.rootResourceId,
    restApi: api.id,
    pathPart: "categories"
})

const method = new aws.apigateway.Method("root-GET-method", {
    httpMethod: "GET",
    resourceId: resource.id,
    restApi: api.id,
    authorization: "NONE",
});

const integration = new aws.apigateway.Integration("integration", {
    restApi: api.id,
    resourceId: resource.id,
    httpMethod: method.httpMethod,
    integrationHttpMethod: "POST",
    type: "AWS_PROXY",
    uri: fn.invokeArn
});

const pulumiResources = [resource, integration, method];

pulumi.all(pulumiResources)
    .apply(values => pulumi.jsonStringify(values))
    .apply(json => pulumi.log.info(json))

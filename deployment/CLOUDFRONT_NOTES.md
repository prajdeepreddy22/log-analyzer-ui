# CloudFront Deployment Notes

## SSE origin response timeout

The `/api/*` CloudFront cache behavior's origin response timeout must be set to
300 seconds, which is the maximum supported value. The default is 60 seconds.
Without this change, SSE streaming chat responses can be cut off during long AI
generations.

Set it in the AWS console:

`CloudFront -> Distribution -> Origins -> Edit origin -> Response timeout`

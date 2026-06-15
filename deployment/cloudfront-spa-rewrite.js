function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (
    uri === '/' ||
    uri.split('/').pop().indexOf('.') === -1
  ) {
    request.uri = '/index.html';
  }

  return request;
}

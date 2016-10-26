const CLIENT_ID = "";
var SCOPES = ['https://www.googleapis.com/auth/drive']

var oauthToken;
function checkAuth() {
    gapi.auth.authorize(
        {
            'client_id': CLIENT_ID,
            'scope': SCOPES.join(' '),
            'immediate': true
        },
        function (authResult) {
            oauthToken = authResult.access_token;
        }); 
}
function onApiLoad() {
  console.log("Loaded api")
  window.gapi.load('picker', {'callback': initPage });
}

function initPage() {
    console.log("Initialized page")
    var btn = document.getElementById('saveBtn');
    btn.onclick = writeFile;
}

function writeFile(evt) {
   var fileName = document.getElementById("fileName").value;
   var content = document.getElementById("content");
   var files = content.files
   if (!files.length) {
       alert("ファイルを選択して下さい。");
       return
   }
   loadFile(fileName, files[0], save);
}

function loadFile(fileName, file, callback) {
    var reader = new FileReader();
    reader.onload = (function(name, theFile) {
        return function(e) {
            var re = new RegExp('^data:'+file.type+';base64,')
            callback(name, theFile, e.target.result.replace(re, ""))
      };
    })(fileName, file);

    reader.readAsDataURL(file);
}

function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

var metadata_id;
function save(fileName, file, data) {
    gapi.client.load('drive', 'v2', function () {
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        if (!fileName) {
            fileName = file.name;
        }            
        console.log("fileName: " + fileName);
        console.log(file)

        var contentType = file.type;
        var metadata = {
            'title': fileName,
            'mimeType': contentType,
            'parents': [{id: '0B4qlaSuznH0-OThtcS1OZ05jSms'}],
        };

        console.log(metadata)

        //var base64Data = utf8_to_b64(content);
        var multipartRequestBody = delimiter +
            'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' + data + close_delim;

        var request_arg;
        if (!metadata_id) {
            request_arg = {
                'path': '/upload/drive/v2/files',
                'method': 'POST',
                //'body': data,
                'params': {
                    'uploadType': 'multipart'
                },
                'headers': {
                    'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody
            }
        }
        else
        {
            request_arg = {
                'path': '/upload/drive/v2/files/' + encodeURIComponent(metadata_id),
                'method': 'PUT',
                //'body': data,
                'params': {
                    'uploadType': 'multipart'
                },
                'headers': {
                    'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody
            }
        }
        var request = gapi.client.request(request_arg);
        request.execute(function (response) {
            console.log(response)
            alert("保存しました。");
            //metadata_id = response.id;
        });
    });
}              

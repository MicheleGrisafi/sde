from flask import Flask, request, jsonify
import evernote.edam.userstore.constants as UserStoreConstants
import evernote.edam.type.ttypes as Types
import evernote.edam.notestore.ttypes as NoteStoreTypes
import json
import struct
import base64



from evernote.api.client import EvernoteClient

port=9001
app = Flask(__name__)

client = None
access_token = None


class Note:
    def __init__(self,id,title, lastUpdated, content):
        self.title = title
        self.lastUpdated = lastUpdated
        self.content = content
        self.id=id


#************** END POINTS *****************
@app.before_request
def before_request():
    # Perform some check before every requests
    
    # Checks if the access token is present and valid.
    auth_header = request.headers.get('Authorization')
    if auth_header is None or 'Bearer' not in auth_header:
        return json.dumps({
            'error': 'Access token does not exist.'
        }), 401
    
    global access_token
    access_token = auth_header[7:]
    print access_token
    global client 
    client = EvernoteClient(token=access_token, sandbox=True, china=False)

    user_store = client.get_user_store()

    version_ok = user_store.checkVersion(
        "Evernote EDAMTest (Python)",
        UserStoreConstants.EDAM_VERSION_MAJOR,
        UserStoreConstants.EDAM_VERSION_MINOR
    )
    print "Is my Evernote API version up to date? ", str(version_ok)
    print ""
    if not version_ok:
        return json.dumps({
            'error': 'API version is outdated'
        }), 500
    print "Auth is OK"


@app.route('/evernote/notes', methods= ['GET'])
def get_notes():
    print "Gettings notes\n"
    note_store = client.get_note_store()

    # List all of the notebooks in the user's account
    notebooks = note_store.listNotebooks()
    noteFilter = NoteStoreTypes.NoteFilter()
    resultSpec = NoteStoreTypes.NotesMetadataResultSpec()
    resultSpec.includeTitle = True
    
    result = note_store.findNotesMetadata(access_token,noteFilter,0,32,resultSpec)
    print "Found ", len(result.notes), " notes:"
    print result.notes
    response = []
    for note in result.notes:
        response.append({"id":note.guid,"title":note.title})
    return json.dumps(response),200

@app.route('/evernote/notes/<id>', methods= ['GET'])
def get_note(id):
    note_store = client.get_note_store()

    # List all of the notebooks in the user's account
    notebooks = note_store.listNotebooks()
    noteFilter = NoteStoreTypes.NoteFilter()
    result = note_store.getNote(access_token,str(id),True,True,True,True)

    note = Note(id,result.title,result.updated,base64.standard_b64encode(result.content))

    return json.dumps(note,default=lambda x: x.__dict__),200


if __name__ == '__main__':
    app.run(port = port, debug = True)

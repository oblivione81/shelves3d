/**
 * Created with JetBrains RubyMine.
 * User: oblivion
 * Date: 16/11/12
 * Time: 12.38
 * To change this template use File | Settings | File Templates.
 */
//= require three
//= require ColladaLoader
//= require TrackballControl
//= require shelves



var env3d_scene, env3d_camera, env3d_renderer;

var env3d_model_environment_model;
var env3d_model_bookcase_template;
var env3d_model_bookcases = [];

//array of arrays of 3d models of books.
//An element at index i of this array is the list of all the books in the
//bookcase at slot i.
var env3d_model_books = [];
var env3d_bookcase_slots = [];     //list of {position, rotation}
var env3d_projector;
var env3d_selected;
var env3d_highlighted_model;
var env3d_animators;
var env3d_current_picked_book;
var env3d_current_picked_book_position;



function placeOnBookcases(books_entries)
{
    var placedBooks = 0;

    while (placedBooks < books_entries.length)
    {
        var bookcaseIndex = addBookCaseToScene();

        if (bookcaseIndex < 0)
        {
            console.log("Out of bookcase slots! Placed:" + placedBooks);
            return;
        }
        else
        {
            placedBooks += placeOnABookcase(
                env3d_model_bookcases[bookcaseIndex],
                books_entries,
                env3d_model_books[bookcaseIndex]);
        }
    }
}

//returns the index in the array of the added bookcase
function addBookCaseToScene()
{
    //var new_bookcase = new THREE.Mesh(env3d_model_bookcase_template.geometry, env3d_model_bookcase_template.material);

    if (env3d_model_bookcases.length < env3d_bookcase_slots.length)
    {
        var new_bookcase = env3d_model_bookcase_template.clone();
        new_bookcase.name = "bookcase" + env3d_model_bookcases.length;

        for (var i = 0; i < env3d_model_bookcase_template.children.length; i++)
        {
         /*   var child = env3d_model_bookcase_template.children[i];
            var mesh = new THREE.Mesh(child.geometry, child.material);
            mesh.name = child.name;*/
            new_bookcase.add( env3d_model_bookcase_template.children[i].clone());
        }

        var slot = env3d_bookcase_slots[env3d_model_bookcases.length];
        new_bookcase.position = slot.position;
        new_bookcase.rotation.y = slot.rotation;
        env3d_model_environment_model.add(new_bookcase);
        env3d_model_bookcases.push(new_bookcase);
        env3d_model_books.push(new Array);

        env3d_model_environment_model.updateMatrixWorld();
        var pos = slot.position;
        pos.y -= 0;
        env3d_camera.lookAt(pos);
        return env3d_model_bookcases.length - 1;
    }

    return -1;
}

function __doSelectBook(bookModel)
{
    bookModel.position.z += 2.0;
}

function __doDeselectBook(bookModel)
{
    bookModel.position.z -= 2.0;
}





function clearHighlight()
{
//    if(env3d_highlighted_model)
//        env3d_highlighted_model.material.color =  new THREE.Color(0xFFFFFF);
}

function selectBook(bookIndex)
{

}

function clearSelection()
{

}

function loadEnvironmentModel(modelFileName, callback)
{
    var collada_loader = new THREE.ColladaLoader();
    collada_loader.options.convertUpAxis = true;

    collada_loader.load( modelFileName, function(load_result){
        env3d_model_environment_model = load_result.scene.getChildByName("environment", true);

        env3d_scene.add(env3d_model_environment_model);

        //search for the camera
        var camera = env3d_model_environment_model.getChildByName("camera0", true);
        if (camera)
        {
            camera.visible = false;
            env3d_model_environment_model.add(env3d_camera);
            env3d_camera.position = camera.position;
            env3d_camera.rotation.set(0, 0, 0);

            env3d_model_environment_model.updateMatrixWorld();

            var t = env3d_model_environment_model.worldToLocal(new THREE.Vector3(0, 0, 0));
            env3d_camera.lookAt(t);
        }
        var slot;
        var slot_index = 0;
        do
        {
            slot = env3d_model_environment_model.getChildByName("slot" + slot_index, true);
            if (slot)
            {
                slot.visible = false;
                env3d_bookcase_slots.push({position:slot.position, rotation:slot.rotation});
                slot_index++;
            }
        }while(slot);
        console.log("Slots found:" + slot_index);
        callback(load_result);
    });
}

function loadBookcaseTemplate(modelFileName, callback)
{
    var collada_loader = new THREE.ColladaLoader();
    collada_loader.options.convertUpAxis = true;

    collada_loader.load( modelFileName, function(load_result){
        env3d_model_bookcase_template = load_result.scene.getChildByName("a_bookcase", true);

        callback(load_result);
    });
}


function env3d_init(width, height, elementId)
{
    env3d_scene = new THREE.Scene();
    env3d_camera = new THREE.PerspectiveCamera(55, width/height, 1, 500);

    rendering_canvas = document.getElementById(elementId);
    width = rendering_canvas.offsetWidth;
    height = rendering_canvas.offsetHeight;

    env3d_renderer = new THREE.WebGLRenderer({antialias:true, canvas:rendering_canvas});

    env3d_renderer.setSize(width, height);
    //div_rendering_canvas.appendChild(env3d_renderer.domElement);


    //---------------------------------------------------------
    //LIGTHS
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.castShadow = true;
    directionalLight.position.set( 3, 5, 5 );
    env3d_scene.add( directionalLight );
    directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.castShadow = true;
    directionalLight.position.set( 5, 5, 2 );
    env3d_scene.add( directionalLight );

    //----------------------------------------------------------
    //CAMERA
    env3d_camera.position.set(0, 0, 0);
    //env3d_camera.lookAt(new THREE.Vector3(-1, 0, 0));


    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'resize', onWindowResize, false);
    document.addEventListener( 'mousedown', onDocumentMouseDown, false);

    env3d_projector = new THREE.Projector();

    highliter = new AnimationTimer(1, highlighterCallback, true);
    highliter.start();

    env3d_animators = new Array;
    env3d_animators.push(highliter);
}

function onDocumentMouseDown( event )
{
    event.preventDefault();

    var pos = fromScreenToRenderer(new THREE.Vector2(event.clientX, event.clientY), "div_rendering_canvas");

    var pickedBook = bookAtRendererCoordinates(pos.x, pos.y);

    if (pickedBook && pickedBook != env3d_current_picked_book)
    {
        if(env3d_current_picked_book) env3d_current_picked_book.position = env3d_current_picked_book_position;
        env3d_current_picked_book = pickedBook;
        env3d_current_picked_book_position = pickedBook.position.clone();

        var bookcase = env3d_current_picked_book.parent;

        cameraPosInBookCaseWorld = bookcase.worldToLocal(env3d_camera.matrixWorld.getPosition().clone());

        var animator = new AnimationTimer(0.5, function(t)
            {
                if (t == 1.0)
                {
                    var indexToRemove = env3d_animators.indexOf(animator);
                    env3d_animators.splice(indexToRemove, 1);
                }

                pickedBook.position = interpVector3(env3d_current_picked_book_position, cameraPosInBookCaseWorld, t);

                clearLog();
                logVector("From:", env3d_current_picked_book_position);
                logVector("To:", cameraPosInBookCaseWorld);
                logVector("Current:", pickedBook.position);
            },
            false);
        animator.start();
        env3d_animators.push(animator);
    }
}

function onDocumentMouseMove( event )
{
    event.preventDefault();

    var pos = fromScreenToRenderer(new THREE.Vector2(event.clientX, event.clientY), "div_rendering_canvas");

    mouseOnScreen(pos.x, pos.y);
}



function bookAtRendererCoordinates(x, y)
{
    if (env3d_model_books.length == 0)
        return null;

    var vector = new THREE.Vector3(x, y, 0.5);
    env3d_projector.unprojectVector(vector, env3d_camera);

    var cameraPos = env3d_camera.matrixWorld.getPosition().clone();
    vector.subSelf(cameraPos).normalize();

    var ray = new THREE.Ray(cameraPos, vector );
    var intersects = ray.intersectObjects( env3d_model_books[0]);

    if (intersects.length > 0)
    {
        return intersects[0].object;
    }
    else
        return null;
}

//coordinates are relative to the renderer
function mouseOnScreen(x, y)
{
    if (env3d_model_books.length == 0)
        return;

    var vector = new THREE.Vector3(x, y, 0.5);
    env3d_projector.unprojectVector(vector, env3d_camera);

    var cameraPos = env3d_camera.matrixWorld.getPosition().clone();
    vector.subSelf(cameraPos).normalize();

    var ray = new THREE.Ray(cameraPos, vector );
    var intersects = ray.intersectObjects( env3d_model_books[0]);

    if ( intersects.length > 0 )
    {
        var obj = intersects[0];
        if (obj != env3d_selected)
        {
            if (env3d_selected) __doDeselectBook(env3d_selected);

            __doSelectBook(obj.object);
            env3d_selected = obj.object;
        }
    }
    else
    {
        if (env3d_selected)
        {
            __doDeselectBook(env3d_selected);
            env3d_selected = null;
        }
    }
}

function onWindowResize() {

    env3d_camera.aspect = window.innerWidth / window.innerHeight;
    env3d_camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}



function highlighterCallback(t)
{
    var RED = new THREE.Color(0xFF0000);
    var WHITE = new THREE.Color(0xFFFFFF);

    if (env3d_highlighted_model)
    {
        if (t <= 0.5)
        {
            env3d_highlighted_model.material.color = interpColor(RED, WHITE, t*2);
        }
        else
        {
            env3d_highlighted_model.material.color = interpColor(WHITE, RED, (t - 0.5)*2);
        }
    }
}

function moveToCameraCallback(t)
{

}


function env3d_render()
{

    requestAnimationFrame(env3d_render);
    env3d_renderer.render(env3d_scene, env3d_camera);

    for (var i = 0; i < env3d_animators.length; i++)
        env3d_animators[i].update();
}


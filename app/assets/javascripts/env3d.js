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

var env3d_width, env3d_height;

var env3d_animators;
var env3d_current_picked_book;
var env3d_current_picked_book_position;


function hsvToRgb(h, s, v){
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }

    return [r * 255, g * 255, b * 255];
}

function colorToHex(r, g, b)
{
    return b | (g << 8) | (r << 16);
}

var golden_ratio_conjugate = 0.618033988749895;
var h = Math.random();
function random_color()
{
    h += golden_ratio_conjugate;
    h %= 1;
    return hsvToRgb(h, 0.5, 0.95);
}

//books_entries: array of {book_title, book_num_pages, book_image_url}
function placeOnAShelve(booksEntries, shelveNode, fromIndex, booksModels)
{
    var offset = 0;
    var temp_max_books = 20;

    for (var i = 0; i < temp_max_books && fromIndex + i < booksEntries.length; i++)
    {
        var abs_index = fromIndex + i;
        if (shelveNode.geometry)
        {
            var pages = booksEntries[abs_index].book_num_pages;

            var book_size =  pages * 5 / 350;
            book_size *= (1 / Math.log(pages));

            var book_height = 6 + 2 * Math.random();
            var geo = new THREE.CubeGeometry(book_size, book_height, 6);

            c = random_color();
            var texture = THREE.ImageUtils.loadTexture
                (
                    "/home/proxy?url=" + booksEntries[abs_index].book_image_url,
                    {},
                    function() {}
                );

            //var mat = new THREE.MeshBasicMaterial({color : colorToHex(c[0], c[1], c[2])});
            var mat = new THREE.MeshBasicMaterial({/*color : colorToHex(c[0], c[1], c[2]),*/ map: texture});


            var book = new THREE.Mesh(geo, mat);

            book.position.x = offset + shelveNode.position.x + book_size / 2;
            book.position.y = shelveNode.position.y + book_height / 2.0 + 0.5;
            book.position.z = shelveNode.position.z - 4;

            var bookcase = shelveNode.parent;
            bookcase.add(book);
            booksModels.push(book);

            offset += book_size + 0.4;
        }
    }
    return fromIndex + i;
}

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
            placedBooks += placeOnABookcase(bookcaseIndex, books_entries);
        }
    }
}

function placeOnABookcase(bookcaseIndex, booksEntries)
{
    var shelvesNodes = [];

    var bookcase = env3d_model_bookcases[bookcaseIndex];
    var node = null;

    var index = 0;
    do
    {
        node = bookcase.getChildByName("sh" + index, true);
        if (node)
            shelvesNodes.push(node);
        index++;
    }while(node && index < 100 /*sanity check!*/);

    if (shelvesNodes.length > 0)
        return placeOnShelves(booksEntries, shelvesNodes, env3d_model_books[bookcaseIndex]);
    else
        return 0;
}

function placeOnShelves(booksEntries, shelvesNodes, booksModels)
{
    var from_index = 0;
    var shelf_index = 0;

    while (from_index < booksEntries.length)
    {
        from_index = placeOnAShelve(booksEntries, shelvesNodes[shelf_index], from_index, booksModels);
        shelf_index++;
    }

    return from_index;
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
//    env3d_model_bookcase = res.scene;
//    env3d_model_bookcase.scale.set(0.1, 0.1, 0.1);
//    env3d_model_bookcase.position.set(0.0, 0.0, 0.0);
//    env3d_scene.add(env3d_model_bookcase);
}

function __doSelectBook(bookModel)
{
    bookModel.position.z += 2.0;
}

function __doDeselectBook(bookModel)
{
    bookModel.position.z -= 2.0;
}

function __findBookModelByIndex(bookIndex)
{
    var firstIndexOfCase = 0;
    for (var caseIndex = 0; caseIndex < env3d_model_books.length; caseIndex++)
    {
        var modelsOfCurrentCase = env3d_model_books[caseIndex];
        if (bookIndex < firstIndexOfCase + modelsOfCurrentCase.length)
        {
            return modelsOfCurrentCase[bookIndex - firstIndexOfCase];
        }
        firstIndexOfCase += modelsOfCurrentCase.length;
    }
    return null;
}

function highlightBook(bookIndex)
{
    var bookModel = __findBookModelByIndex(bookIndex);
    if (bookModel)
    {
  //      bookModel.material.color = new THREE.Color(0xFF0000);
        env3d_highlighted_model = bookModel;
        bookPosition = env3d_model_environment_model.worldToLocal(bookModel.matrixWorld.getPosition().clone());
        env3d_camera.position = bookPosition
        env3d_camera.position.z += 30;
        env3d_camera.lookAt(bookPosition);
    }
    else
    {
        console.log("Book model not found at index:" + bookIndex);
    }
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
    width = window.innerWidth;
    height = window.innerHeight;
    env3d_scene = new THREE.Scene();
    env3d_camera = new THREE.PerspectiveCamera(55, width/height, 1, 500);

    rendering_canvas = document.getElementById(elementId);

    env3d_renderer = new THREE.WebGLRenderer({antialias:true, canvas:rendering_canvas});

    env3d_renderer.setSize(width, height);
    //div_rendering_canvas.appendChild(env3d_renderer.domElement);

    env3d_width = width;
    env3d_height = height;
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

    var x = ( event.clientX / window.innerWidth) * 2 - 1;
    var y = - ( event.clientY / window.innerHeight) * 2 + 1;

    var pickedBook = bookAtRendererCoordinates(x, y);

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

    var x = ( event.clientX / window.innerWidth) * 2 - 1;
    var y = - ( event.clientY / window.innerHeight) * 2 + 1;
    clearLog();

    mouseOnScreen(x, y);
}

function clearLog()
{
    $("#div_log").text("");
}
function logVector(name, v)
{
    appendLog(name + ":" + v.x + "," + v.y + "," + v.z);
}
function appendLog(text)
{
    $("#div_log").append("<br>" + text);
}

function bookAtRendererCoordinates(x, y)
{
    if (env3d_model_books.length == 0)
        return;

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
        appendLog("FOUND!!");
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

function interpColor(colorA, colorB, alpha)
{
    var blended = new THREE.Color();

    blended.r = colorA.r * alpha + colorB.r * (1 - alpha);
    blended.g = colorA.g * alpha + colorB.g * (1 - alpha);
    blended.b = colorA.b * alpha + colorB.b * (1 - alpha);

    return blended;
}

function interpVector3(v1, v2, alpha)
{
    var interp = new THREE.Vector3();

    interp.x = v1.x * (1-alpha) + v2.x *  alpha;
    interp.y = v1.y * (1-alpha) + v2.y *  alpha;
    interp.z = v1.z * (1-alpha) + v2.z *  alpha;

    return interp;
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


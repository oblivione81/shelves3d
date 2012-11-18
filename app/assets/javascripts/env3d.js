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
var env3d_bookcase_slots = [];     //list of {position, rotation}

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
function __disposeOnAShelve(books_entries, shelve_node, from_index)
{
    var offset = 0;

    var temp_max_books = 20;

    for (var i = 0; i < temp_max_books && from_index + i < books_entries.length; i++)
    {
        var abs_index = from_index + i;
        if (shelve_node.geometry)
        {
            var pages = books_entries[abs_index].book_num_pages;

            var book_size =  pages * 5 / 350;
            book_size *= (1 / Math.log(pages));

            var book_height = 6 + 2 * Math.random();
            var geo = new THREE.CubeGeometry(book_size, book_height, 6);

            c = random_color();
            var texture = THREE.ImageUtils.loadTexture
            (
                "/home/proxy?url=" + books_entries[abs_index].book_image_url,
                {},
                function() {env3d_render();}
            );

            //var mat = new THREE.MeshBasicMaterial({color : colorToHex(c[0], c[1], c[2])});
            var mat = new THREE.MeshBasicMaterial({/*color : colorToHex(c[0], c[1], c[2]),*/ map: texture});


            var book = new THREE.Mesh(geo, mat);

            book.position.x = offset + shelve_node.position.x + book_size / 2;
            book.position.y = shelve_node.position.y + book_height / 2.0 + 0.5;
            book.position.z = shelve_node.position.z - 4;

            var bookcase = shelve_node.parent;
            bookcase.add(book);

            offset += book_size + 0.4;
        }
    }
    env3d_render();
    return from_index + i;
}

function disposeOnShelves(books_entries)
{
    var shelves_nodes = [];

    for (var i = 0; i < env3d_model_bookcases.length; i++)
    {
        var book_case = env3d_model_bookcases[i];
        var node = null;

        var index = 0;
        do
        {
            node = book_case.getChildByName("sh" + index, true);
            if (node)
                shelves_nodes.push(node);
            index++;
        }while(node && index < 100 /*sanity check!*/);
    }

    __disposeOnShelves(books_entries, shelves_nodes);
}

//books_entries: array of {name:string, pages:int, image_url:url}
//shelves_nodes: array of Object3D nodes
function __disposeOnShelves(books_entries, shelves_nodes)
{
  var from_index = 0;

  var shelf_index = 0;
  while (from_index < books_entries.length)
  {
      from_index = __disposeOnAShelve(books_entries, shelves_nodes[shelf_index], from_index);
      shelf_index++;
  }
}

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

        env3d_model_environment_model.updateMatrixWorld();
        env3d_camera.lookAt(slot.position);
    }


//    env3d_model_bookcase = res.scene;
//    env3d_model_bookcase.scale.set(0.1, 0.1, 0.1);
//    env3d_model_bookcase.position.set(0.0, 0.0, 0.0);
//    env3d_scene.add(env3d_model_bookcase);
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
        addBookCaseToScene();//temp
        addBookCaseToScene();//temp
        addBookCaseToScene();//temp

        callback(load_result);
    });
}


function env3d_init(width, height, elementId)
{
    env3d_scene = new THREE.Scene();
    env3d_camera = new THREE.PerspectiveCamera(55, width/height, 1, 500);

    rendering_canvas = document.getElementById(elementId);

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
    env3d_camera.position.set(2, 8, 6);
    env3d_camera.lookAt(new THREE.Vector3(0, 5, 0));

    controls = new THREE.TrackballControls( env3d_camera );
    controls.target.set( 0, 0, 0 );
}

function env3d_render()
{
    //requestAnimationFrame(env3d_render);
    env3d_renderer.render(env3d_scene, env3d_camera);
}


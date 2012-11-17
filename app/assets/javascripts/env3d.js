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

var env3d_model_bookcase;

function hsvToRgb(h, s, v){
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return [r * 255, g * 255, b * 255];
}

function colorToHex(r, g, b) {
    var rgb = b | (g << 8) | (r << 16);
    //return '0x' + rgb.toString(16);
    //return '0xFFAAFF';
    return rgb;
}

var golden_ratio_conjugate = 0.618033988749895
var h = Math.random();
function random_color()
{
    h += golden_ratio_conjugate;
    h %= 1;
    return hsvToRgb(h, 0.5, 0.95);
}


//books_entries: array of {book_title, book_num_pages, book_image_url}
function __disposeOnAShelve(books_entries, shelve_node)
{
    var offset = 0;
    for (var i = 0; i < books_entries.length; i++)
    {
        if (shelve_node.geometry)
        {
            var book_size = books_entries[i].book_num_pages * 0.1 / 200;
            var geo = new THREE.CubeGeometry(book_size,0.8,0.6);

            c = random_color();
            var texture = THREE.ImageUtils.loadTexture
            (
                "/home/proxy?url=" + books_entries[i].book_image_url,
                {},
                function() {env3d_render();}
            );

            //var mat = new THREE.MeshBasicMaterial({color : colorToHex(c[0], c[1], c[2])});
            var mat = new THREE.MeshBasicMaterial({/*color : colorToHex(c[0], c[1], c[2]),*/ map: texture});


            var book = new THREE.Mesh(geo, mat);

            book.position.x = offset + shelve_node.position.x * 0.1 + book_size / 2;
            book.position.y = shelve_node.position.y * 0.1 + 0.45;
            book.position.z = shelve_node.position.z * 0.1 - 0.4;

            offset += book_size + 0.02;
            env3d_scene.add(book);
        }
    }
    env3d_render();
}

function disposeOnShelves(books_entries)
{
    var shelves_nodes = [];

    shelves_nodes.push(env3d_model_bookcase.getChildByName("sh0", true));

    __disposeOnShelves(books_entries, shelves_nodes);
}

//books_entries: array of {name:string, pages:int, image_url:url}
//shelves_nodes: array of Object3D nodes
function __disposeOnShelves(books_entries, shelves_nodes)
{
  __disposeOnAShelve(books_entries, shelves_nodes[0])
}

function addBookCaseToScene(res)
{
    env3d_model_bookcase = res.scene;
    env3d_model_bookcase.scale.set(0.1, 0.1, 0.1);
    env3d_model_bookcase.position.set(0.0, 0.0, 0.0);
    env3d_scene.add(env3d_model_bookcase);
}


function loadBookcase(modelName, callback)
{
    var loader = new THREE.ColladaLoader();
    loader.options.convertUpAxis = true;
    loader.load( '../billy.dae', callback);
}


function env3d_init(width, height, elementId)
{
    env3d_scene = new THREE.Scene();
    env3d_camera = new THREE.PerspectiveCamera(55, width/height, 0.001, 1000);

    rendering_canvas = document.getElementById(elementId);

    env3d_renderer = new THREE.WebGLRenderer({antialias:true, canvas:rendering_canvas});

    env3d_renderer.setSize(width, height);
    //div_rendering_canvas.appendChild(env3d_renderer.domElement);

    //---------------------------------------------------------
    //GROUND
    var ground_geometry = new THREE.CubeGeometry(20,0.1,20);
    var ground_material = new THREE.MeshBasicMaterial({color: 0xaaaaaa});
    var ground  = new THREE.Mesh(ground_geometry, ground_material);
    env3d_scene.add(ground);
    ground.position.set(0, 0, 0);

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
    env3d_camera.position.set(2, 9, 5);
    env3d_camera.lookAt(new THREE.Vector3(0, 4.5, 0));

    controls = new THREE.TrackballControls( env3d_camera );
    controls.target.set( 0, 0, 0 );
}

function env3d_render()
{
    requestAnimationFrame(env3d_render);
    env3d_renderer.render(env3d_scene, env3d_camera);
}


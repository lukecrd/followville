extends SceneTree
# Render every res://buildings/*.tscn to ../public/sprites/<name>.png (2D map)
# and export its triangles to ../public/models/<name>.bin (3D view, see lib/city3d-scene.ts).
# with the same isometric 2:1 projection as the SVG map (tile = 60x30 SVG units).
# Run from the repo root: & "C:/Program Files/Godot/Godot.exe" --path godot --script res://render.gd

const PX := 1024 # sprite side in pixels = 256 SVG units (4 px per unit, sharp up to the map's 6x zoom)
const PX_PER_TILE := 240.0 # 60 SVG units * 4
const ORIGIN := Vector2(512, 800) # pixel where the tile centre (world 0,0,0) lands

func _initialize() -> void:
	_run()

func _run() -> void:
	var vp := SubViewport.new()
	vp.size = Vector2i(PX, PX)
	vp.transparent_bg = true
	vp.msaa_3d = Viewport.MSAA_4X
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	vp.own_world_3d = true
	root.add_child(vp)

	var unit := PX_PER_TILE / sqrt(2.0) # pixels per world unit
	var cam := Camera3D.new()
	cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	cam.size = PX / unit
	cam.rotation_degrees = Vector3(-30, 45, 0) # pitch 30° gives the 2:1 diamond
	cam.position = cam.basis.z * 50
	cam.v_offset = (ORIGIN.y - PX / 2.0) / unit
	vp.add_child(cam)

	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-50, -25, 0) # like the SVG palette: left (+Z) walls lit, right (+X) walls in shade
	sun.shadow_enabled = true
	vp.add_child(sun)
	var env := Environment.new()
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color.WHITE
	env.ambient_light_energy = 0.55
	var world_env := WorldEnvironment.new()
	world_env.environment = env
	vp.add_child(world_env)

	var out := ProjectSettings.globalize_path("res://").path_join("../public/sprites")
	DirAccess.make_dir_recursive_absolute(out)
	var models := ProjectSettings.globalize_path("res://").path_join("../public/models")
	DirAccess.make_dir_recursive_absolute(models)
	for f in DirAccess.get_files_at("res://buildings"):
		if not f.ends_with(".tscn"):
			continue
		var node: Node = load("res://buildings/" + f).instantiate()
		vp.add_child(node)
		for i in 3:
			await process_frame
		await RenderingServer.frame_post_draw
		var path := out.path_join(f.get_basename() + ".png")
		var err := vp.get_texture().get_image().save_png(path)
		print("rendered " if err == OK else "FAILED ", path)
		_export_mesh(node, models.path_join(f.get_basename() + ".bin"))
		node.queue_free()
	quit()

# Little-endian float32, 9 per vertex (position, normal, sRGB colour), 3 vertices per triangle:
# the layout of Mesh.data in lib/city3d-mesh.ts. Only root CSG shapes are exported (Label3D text is skipped).
func _export_mesh(scene: Node, path: String) -> void:
	var out := PackedFloat32Array()
	for csg in scene.find_children("*", "CSGShape3D", true, false):
		if not csg.is_root_shape():
			continue
		var baked: Array = csg.get_meshes()
		if baked.is_empty():
			continue
		var xf: Transform3D = csg.global_transform
		var normal_basis := xf.basis.inverse().transposed()
		var mesh: Mesh = baked[1]
		for s in mesh.get_surface_count():
			var mat: Material = mesh.surface_get_material(s)
			if mat == null:
				mat = csg.material_override
			var c: Color = mat.albedo_color if mat is StandardMaterial3D else Color.WHITE
			var arrays := mesh.surface_get_arrays(s)
			var verts: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
			var normals: PackedVector3Array = arrays[Mesh.ARRAY_NORMAL]
			var index := PackedInt32Array() if arrays[Mesh.ARRAY_INDEX] == null else PackedInt32Array(arrays[Mesh.ARRAY_INDEX])
			var count := index.size() if index.size() > 0 else verts.size()
			for k in count:
				var v := index[k] if index.size() > 0 else k
				var pos := xf * verts[v]
				var n := (normal_basis * normals[v]).normalized()
				out.append_array([pos.x, pos.y, pos.z, n.x, n.y, n.z, c.r, c.g, c.b])
	var file := FileAccess.open(path, FileAccess.WRITE)
	file.store_buffer(out.to_byte_array())
	print("exported %d triangles to %s" % [out.size() / 27, path])

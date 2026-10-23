extends SceneTree
# Render every res://buildings/*.tscn to ../public/sprites/<name>.png
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
		node.queue_free()
	quit()

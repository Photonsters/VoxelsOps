# BinaryVoxelBooleanFilters
this library will process three-dimensional matrix of binary data with boolean operations and some helper filters

# Dependencies
node.js

# Instalation
clone repository
run 'npm i'

# Gyroid infill
run 'node gyroid.js -s PATH_TO_PHOTON_FILE'

gyroid infill script accepts following optional parameters
-d, --dest:       destination directory path (if not defined it will be generated from source)
-r, --radius:     erosion radius, or simply thickness of walls in voxels (default is 15 vx)
-p, --patters:    pattern size in voxels (default is 100 vx)
-t, --tolerance:  gyroid generator tolerance, higher the number, thicker the gyroid walls are (default is 0.3)

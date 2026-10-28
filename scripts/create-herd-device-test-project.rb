require 'xcodeproj'
require 'fileutils'
require 'tmpdir'

root = File.expand_path(ARGV[0] || File.join(Dir.tmpdir, 'herd-device-checks'))
FileUtils.mkdir_p(root)
FileUtils.cp(File.expand_path('../test/device/HerdDeviceChecks.swift', __dir__), File.join(root, 'HerdDeviceChecks.swift'))
project = Xcodeproj::Project.new(File.join(root, 'HerdDeviceChecks.xcodeproj'))
target = project.new_target(:ui_test_bundle, 'HerdDeviceChecks', :ios, '15.1')
target.source_build_phase.add_file_reference(project.main_group.new_file(File.join(root, 'HerdDeviceChecks.swift')))
target.build_configurations.each do |config|
  config.build_settings.merge!({
    'PRODUCT_BUNDLE_IDENTIFIER' => 'com.herdtrackr.devicechecks',
    'SWIFT_VERSION' => '5.0',
    'GENERATE_INFOPLIST_FILE' => 'YES',
    'CODE_SIGNING_ALLOWED' => 'NO',
    'TARGETED_DEVICE_FAMILY' => '1,2',
    'SDKROOT' => 'iphonesimulator',
    'TEST_TARGET_NAME' => ''
  })
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(target)
scheme.add_test_target(target)
scheme.save_as(project.path, 'HerdDeviceChecks')
puts project.path

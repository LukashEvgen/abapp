#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>

#if DEBUG
#import <FirebaseAppCheck/FIRAppCheckDebugProviderFactory.h>
#else
#import <FirebaseAppCheck/FIRDeviceCheckProviderFactory.h>
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"LexTrack";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

#if DEBUG
  [FIRAppCheck setAppCheckProviderFactory:[[FIRAppCheckDebugProviderFactory alloc] init]];
#else
  [FIRAppCheck setAppCheckProviderFactory:[[FIRDeviceCheckProviderFactory alloc] init]];
#endif

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end

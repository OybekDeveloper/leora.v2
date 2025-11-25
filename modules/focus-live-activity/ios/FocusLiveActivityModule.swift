#if canImport(ActivityKit)

import ActivityKit
import ExpoModulesCore

@available(iOS 16.2, *)
private enum FocusLiveActivityEndReason: String, Enumerable {
  case completed
  case cancelled
  case disabled
}

@available(iOS 16.2, *)
private struct FocusLiveActivityContentState: Codable, Hashable {
  var taskName: String
  var sessionIndex: Int
  var sessionCount: Int
  var totalSeconds: Int
  var elapsedSeconds: Int
  var breakAfterSeconds: Int
  var isMuted: Bool
  var isPaused: Bool
  var updatedAt: Date = Date()
}

@available(iOS 16.2, *)
private struct FocusLiveActivityAttributes: ActivityAttributes {
  public typealias ContentState = FocusLiveActivityContentState
  public var appName: String
}

@available(iOS 16.2, *)
private struct FocusLiveActivityStartRequest: Record {
  @Field var appName: String
  @Field var taskName: String
  @Field var sessionIndex: Int
  @Field var sessionCount: Int
  @Field var totalSeconds: Int
  @Field var elapsedSeconds: Int
  @Field var breakAfterSeconds: Int
  @Field var isMuted: Bool

  func toContentState(isPaused: Bool = false) -> FocusLiveActivityContentState {
    FocusLiveActivityContentState(
      taskName: taskName,
      sessionIndex: sessionIndex,
      sessionCount: sessionCount,
      totalSeconds: totalSeconds,
      elapsedSeconds: elapsedSeconds,
      breakAfterSeconds: breakAfterSeconds,
      isMuted: isMuted,
      isPaused: isPaused
    )
  }
}

@available(iOS 16.2, *)
private struct FocusLiveActivityUpdateRequest: Record {
  @Field var taskName: String
  @Field var sessionIndex: Int
  @Field var sessionCount: Int
  @Field var totalSeconds: Int
  @Field var elapsedSeconds: Int
  @Field var breakAfterSeconds: Int
  @Field var isMuted: Bool
  @Field var isPaused: Bool

  func toContentState() -> FocusLiveActivityContentState {
    FocusLiveActivityContentState(
      taskName: taskName,
      sessionIndex: sessionIndex,
      sessionCount: sessionCount,
      totalSeconds: totalSeconds,
      elapsedSeconds: elapsedSeconds,
      breakAfterSeconds: breakAfterSeconds,
      isMuted: isMuted,
      isPaused: isPaused
    )
  }
}

@available(iOS 16.2, *)
private actor FocusLiveActivityCoordinator {
  static let shared = FocusLiveActivityCoordinator()

  private var activity: Activity<FocusLiveActivityAttributes>?
  private var latestContentState: FocusLiveActivityContentState?

  func start(request: FocusLiveActivityStartRequest) async throws -> Bool {
    if let current = activity {
      await current.end(current.contentState, dismissalPolicy: .immediate)
      activity = nil
      latestContentState = nil
    }

    guard ActivityAuthorizationInfo().areActivitiesEnabled else {
      return false
    }

    let attributes = FocusLiveActivityAttributes(appName: request.appName)
    let state = request.toContentState()

    do {
      activity = try Activity.request(attributes: attributes, contentState: state)
      latestContentState = state
      return true
    } catch {
      activity = nil
      latestContentState = nil
      throw error
    }
  }

  func update(with request: FocusLiveActivityUpdateRequest) async throws {
    guard let activity else { return }
    let nextState = request.toContentState()
    try await activity.update(using: nextState)
    latestContentState = nextState
  }

  func stop(reason: FocusLiveActivityEndReason) async {
    guard let activity else { return }
    let dismissal: ActivityUIDismissalPolicy = reason == .completed ? .default : .immediate
    let finalState = latestContentState ?? activity.contentState
    await activity.end(finalState, dismissalPolicy: dismissal)
    self.activity = nil
    self.latestContentState = nil
  }
}

public final class FocusLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FocusLiveActivity")

    AsyncFunction("isAvailableAsync") { () -> Bool in
      if #available(iOS 16.2, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    AsyncFunction("startActivityAsync") { (request: FocusLiveActivityStartRequest) -> Bool in
      if #available(iOS 16.2, *) {
        do {
          return try await FocusLiveActivityCoordinator.shared.start(request: request)
        } catch {
          throw error
        }
      }
      return false
    }

    AsyncFunction("updateActivityAsync") { (request: FocusLiveActivityUpdateRequest) -> Void in
      if #available(iOS 16.2, *) {
        do {
          try await FocusLiveActivityCoordinator.shared.update(with: request)
        } catch {
          throw error
        }
      }
    }

    AsyncFunction("stopActivityAsync") { (reason: FocusLiveActivityEndReason) -> Void in
      if #available(iOS 16.2, *) {
        await FocusLiveActivityCoordinator.shared.stop(reason: reason)
      }
    }
  }
}

#else

import ExpoModulesCore

public final class FocusLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FocusLiveActivity")

    AsyncFunction("isAvailableAsync") { () -> Bool in
      false
    }

    AsyncFunction("startActivityAsync") { (_: [String: AnyHashable]) -> Bool in
      false
    }

    AsyncFunction("updateActivityAsync") { (_: [String: AnyHashable]) -> Void in
    }

    AsyncFunction("stopActivityAsync") { (_: String) -> Void in
    }
  }
}

#endif

import ActivityKit
import Foundation
import SwiftUI
import UIKit
import WidgetKit

struct LiveActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var title: String
        var subtitle: String?
        var timerEndDateInMilliseconds: Double?
        var progress: Double?
        var imageName: String?
        var dynamicIslandImageName: String?
    }

    var name: String
    var backgroundColor: String?
    var titleColor: String?
    var subtitleColor: String?
    var progressViewTint: String?
    var progressViewLabelColor: String?
    var deepLinkUrl: String?
    var timerType: DynamicIslandTimerType?
    var padding: Int?
    var paddingDetails: PaddingDetails?
    var imagePosition: String?
    var imageSize: Int?
    var imageAlign: String?

    enum DynamicIslandTimerType: String, Codable {
        case circular
        case digital
    }

    struct PaddingDetails: Codable, Hashable {
        var top: Int?
        var bottom: Int?
        var left: Int?
        var right: Int?
        var vertical: Int?
        var horizontal: Int?
    }
}

private extension Color {
    static func fromHex(_ hex: String?) -> Color? {
        guard var hex = hex?.trimmingCharacters(in: .whitespacesAndNewlines), !hex.isEmpty else { return nil }
        if hex.hasPrefix("#") {
            hex.removeFirst()
        }
        if hex.count == 6 {
            hex.append("FF")
        }
        guard hex.count == 8, let value = UInt64(hex, radix: 16) else { return nil }
        let red = Double((value >> 24) & 0xFF) / 255
        let green = Double((value >> 16) & 0xFF) / 255
        let blue = Double((value >> 8) & 0xFF) / 255
        let alpha = Double(value & 0xFF) / 255
        return Color(.sRGB, red: red, green: green, blue: blue, opacity: alpha)
    }
}

// MARK: - Monochrome Color Palette
private struct MonochromeColorPalette {
    let background: Color
    let primary: Color
    let secondary: Color
    let tertiary: Color
    let accent: Color
    let divider: Color

    init(attributes: LiveActivityAttributes) {
        // Monochrome palette with subtle gradations
        background = Color.fromHex(attributes.backgroundColor) ?? Color.black
        
        let baseAccent = Color.white.opacity(0.85)
        primary = Color.fromHex(attributes.titleColor) ?? .white
        secondary = primary.opacity(0.6)
        tertiary = primary.opacity(0.4)
        accent = baseAccent
        divider = primary.opacity(0.2)
    }
}

private enum LeoraAssets {
    static let logoName = "liveActivityLogo"

    #if SWIFT_PACKAGE
    private static let bundle = Bundle.module
    #else
    private static let bundle = Bundle.main
    #endif

    static func logoImage() -> Image? {
        guard UIImage(named: logoName, in: bundle, with: nil) != nil else {
            return nil
        }
        return Image(logoName, bundle: bundle)
    }
}

// MARK: - Minimalist Logo
private struct MinimalistLogo: View {
    var size: CGFloat
    var color: Color

    var body: some View {
        Group {
            if let image = LeoraAssets.logoImage() {
                image
                    .renderingMode(.template)
                    .resizable()
                    .scaledToFit()
                    .foregroundStyle(color)
            } else {
                Circle()
                    .fill(color.opacity(0.2))
                    .overlay(
                        Text("L")
                            .font(.system(size: size * 0.6, weight: .medium, design: .rounded))
                            .foregroundStyle(color)
                    )
            }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

struct FocusLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: LiveActivityAttributes.self) { context in
            let palette = MonochromeColorPalette(attributes: context.attributes)
            FocusLiveActivityExpandedView(state: context.state, attributes: context.attributes, palette: palette)
                .activityBackgroundTint(palette.background)
                .activitySystemActionForegroundColor(palette.primary)
        } dynamicIsland: { context in
            let palette = MonochromeColorPalette(attributes: context.attributes)

            return DynamicIsland {
                FocusDynamicIslandExpandedRegions(state: context.state, palette: palette)
            } compactLeading: {
                FocusCompactTimerLabel(state: context.state, palette: palette)
            } compactTrailing: {
                MinimalistLogo(size: 16, color: palette.primary)
            } minimal: {
                FocusMinimalTimer(state: context.state, palette: palette)
            }
        }
    }
}

// MARK: - Expanded Lock Screen View (Safe Area Compliant)
private struct FocusLiveActivityExpandedView: View {
    let state: LiveActivityAttributes.ContentState
    let attributes: LiveActivityAttributes
    let palette: MonochromeColorPalette

    var body: some View {
        TimelineView(.animation(minimumInterval: 0.5)) { timeline in
            let snapshot = FocusTimerAnalyzer.snapshot(for: state, at: timeline.date)
            FocusExpandedContent(snapshot: snapshot, state: state, attributes: attributes, palette: palette)
        }
    }
}

private struct FocusExpandedContent: View {
    let snapshot: FocusTimerSnapshot
    let state: LiveActivityAttributes.ContentState
    let attributes: LiveActivityAttributes
    let palette: MonochromeColorPalette

    @Environment(\.openURL) private var openURL

    var body: some View {
        widgetSafeAreaContainer {
            VStack(alignment: .leading, spacing: 4) {
                topBar
                progressSection
                infoRow
                timerRow
            }
            .padding(.vertical, 6)
            .padding(.horizontal, 10)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var topBar: some View {
        HStack(spacing: 6) {
            MinimalistLogo(size: 18, color: palette.primary)
            Text("LEORA")
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(palette.primary)
                .tracking(1.5)
            Spacer()
            MinimalistIconButton(symbol: "arrow.up.right", palette: palette) {
                openDeeplink(path: "open")
            }
        }
        .padding(.trailing, 8)
    }

    private var progressSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("START")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(palette.secondary)
                    .kerning(0.6)
                Spacer()
                Text(snapshot.subtitle.status.uppercased())
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(palette.tertiary)
            }
            MinimalistSlider(
                progress: snapshot.progress,
                palette: palette,
                currentLabel: FocusTimeFormatter.formattedRemaining(snapshot: snapshot),
                startLabel: FocusTimeFormatter.formattedElapsed(snapshot: snapshot, fallback: "00:00"),
                endLabel: FocusTimeFormatter.formattedTotal(snapshot: snapshot, fallback: "60:00")
            )
        }
    }

    private var infoRow: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 0) {
                Text("Task")
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(palette.tertiary)
                Text(state.title)
                    .font(.caption.weight(.medium))
                    .foregroundStyle(palette.secondary)
                    .lineLimit(1)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 0) {
                Text(snapshot.subtitle.sessionLabel ?? "Session")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(palette.secondary)
                    .lineLimit(1)
                Text(snapshot.subtitle.breakLabel ?? "Break after 05:00")
                    .font(.caption2)
                    .foregroundStyle(palette.tertiary)
            }
        }
    }

    private var timerRow: some View {
        Text(FocusTimeFormatter.formattedRemaining(snapshot: snapshot))
            .font(.system(size: 28, weight: .semibold, design: .rounded))
            .monospacedDigit()
            .foregroundStyle(palette.primary)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.top, 2)
    }

    private func openDeeplink(path: String) {
        guard let url = deeplinkURL(for: path) else { return }
        openURL(url)
    }

    private func deeplinkURL(for action: String) -> URL? {
        let base = attributes.deepLinkUrl ?? "leora://"
        if let url = URL(string: base), url.scheme != nil, url.host != nil {
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
            let normalized = action.hasPrefix("/") ? String(action.dropFirst()) : action
            components?.path = "/" + normalized
            return components?.url
        } else if let url = URL(string: base + (base.hasSuffix("/") ? "" : "/") + action) {
            return url
        } else {
            return URL(string: "leora://\(action)")
        }
    }

    @ViewBuilder
    private func widgetSafeAreaContainer<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        if #available(iOS 17.0, *) {
            content()
                .containerBackground(for: .widget) {
                    RoundedRectangle(cornerRadius: 28, style: .continuous)
                        .fill(palette.background)
                        .overlay(
                            RoundedRectangle(cornerRadius: 28, style: .continuous)
                                .stroke(palette.primary.opacity(0.2), lineWidth: 1)
                        )
                }
        } else {
            content()
                .padding(.vertical, 10)
                .padding(.horizontal, 14)
                .background(
                    RoundedRectangle(cornerRadius: 28, style: .continuous)
                        .fill(palette.background)
                        .overlay(
                            RoundedRectangle(cornerRadius: 28, style: .continuous)
                                .stroke(palette.primary.opacity(0.2), lineWidth: 1)
                        )
                )
        }
    }
}
// MARK: - Dynamic Island Views (Safe Area Compliant)
@DynamicIslandExpandedContentBuilder
private func FocusDynamicIslandExpandedRegions(
    state: LiveActivityAttributes.ContentState,
    palette: MonochromeColorPalette
) -> DynamicIslandExpandedContent<some View> {
    DynamicIslandExpandedRegion(.center, priority: 1) {
        FocusDynamicIslandTimeline(state: state) { snapshot in
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack(spacing: 6) {
                    MinimalistLogo(size: 16, color: palette.primary)
                    
                    Text("LEORA")
                        .font(.caption2.weight(.medium))
                        .kerning(1.2)
                        .foregroundStyle(palette.secondary)
                    
                    Spacer()
                }
                
                // Status
                Text(FocusStatusFormatter.display(from: snapshot).uppercased())
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(palette.tertiary)
                    .kerning(0.5)
                    .lineLimit(1)
                
                // Timer
                Text(FocusTimeFormatter.formattedRemaining(snapshot: snapshot))
                    .font(.system(size: 36, weight: .light, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(palette.primary)
                    .frame(maxWidth: .infinity, alignment: .center)
                
                // Progress
                MinimalistProgressBar(progress: snapshot.progress, palette: palette)
                    .frame(height: 2)
            }
            // No explicit padding - let system handle it
        }
    }

    DynamicIslandExpandedRegion(.bottom) {
        FocusDynamicIslandTimeline(state: state) { snapshot in
            // Simplified controls
            HStack(spacing: 0) {
                Spacer()
                MinimalistControlButton(
                    symbol: snapshot.isRunning ? "pause.fill" : "play.fill",
                    palette: palette
                )
                Spacer()
            }
            // No explicit padding - let system handle it
        }
    }
}

private struct FocusDynamicIslandTimeline<Content: View>: View {
    let state: LiveActivityAttributes.ContentState
    let content: (FocusTimerSnapshot) -> Content

    var body: some View {
        TimelineView(.animation(minimumInterval: 0.5)) { timeline in
            let snapshot = FocusTimerAnalyzer.snapshot(for: state, at: timeline.date)
            content(snapshot)
        }
    }
}

private struct FocusCompactTimerLabel: View {
    let state: LiveActivityAttributes.ContentState
    let palette: MonochromeColorPalette

    var body: some View {
        TimelineView(.animation(minimumInterval: 1)) { timeline in
            let snapshot = FocusTimerAnalyzer.snapshot(for: state, at: timeline.date)
            Text(FocusTimeFormatter.formattedRemaining(snapshot: snapshot, fallback: "--"))
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(palette.primary)
        }
    }
}

private struct FocusMinimalTimer: View {
    let state: LiveActivityAttributes.ContentState
    let palette: MonochromeColorPalette

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 8.0)) { timeline in
            let snapshot = FocusTimerAnalyzer.snapshot(for: state, at: timeline.date)
            VStack(spacing: 4) {
                MinimalistTimerIcon(palette: palette)
                MinimalistProgressBar(progress: snapshot.progress, palette: palette)
                    .frame(width: 28, height: 2)
            }
        }
    }
}

// MARK: - Minimalist UI Components
private struct MinimalistTimerIcon: View {
    var palette: MonochromeColorPalette

    var body: some View {
        Image(systemName: "clock.fill")
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(palette.primary)
            .frame(width: 20, height: 20)
    }
}

private struct MinimalistControlButton: View {
    let symbol: String
    var action: () -> Void = {}
    let palette: MonochromeColorPalette

    var body: some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(palette.primary)
                .frame(width: 30, height: 30)
        }
        .buttonStyle(.plain)
        .background(
            Circle()
                .fill(palette.primary.opacity(0.1))
                .overlay(
                    Circle()
                        .stroke(palette.divider, lineWidth: 0.5)
                )
        )
    }
}

private struct TimeLabel: View {
    let label: String
    let value: String
    let palette: MonochromeColorPalette

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption2.weight(.medium))
                .foregroundStyle(palette.tertiary)
                .kerning(0.6)
            Text(value)
                .font(.caption.weight(.medium))
                .foregroundStyle(palette.secondary)
                .monospacedDigit()
        }
    }
}

private struct MinimalistIconButton: View {
    let symbol: String
    let palette: MonochromeColorPalette
    var action: () -> Void = {}

    var body: some View {
        Button(action: action) {
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(palette.primary.opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(palette.primary.opacity(0.25), lineWidth: 0.5)
                )
                .frame(width: 34, height: 34)
                .overlay(
                    Image(systemName: symbol)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(palette.primary)
                )
        }
        .buttonStyle(.plain)
    }
}

private struct MinimalistSlider: View {
    let progress: Double
    let palette: MonochromeColorPalette
    let currentLabel: String
    let startLabel: String
    let endLabel: String

    var body: some View {
        VStack(spacing: 4) {
            GeometryReader { geometry in
                let clamped = CGFloat(min(max(progress, 0), 1))
                let width = geometry.size.width
                ZStack(alignment: .leading) {
                    Capsule(style: .continuous)
                        .fill(palette.divider)
                        .frame(height: 6)

                    Capsule(style: .continuous)
                        .fill(palette.accent.opacity(0.8))
                        .frame(width: width * clamped, height: 6)

                    Circle()
                        .fill(palette.primary)
                        .frame(width: 18, height: 18)
                        .shadow(color: palette.primary.opacity(0.3), radius: 4, x: 0, y: 2)
                        .offset(x: max(0, min(width - 18, width * clamped - 9)))
                }
            }
            .frame(height: 18)

            HStack {
                Text(startLabel)
                    .font(.caption2)
                    .foregroundStyle(palette.tertiary)
                Spacer()
                Text(currentLabel)
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(palette.secondary)
                Spacer()
                Text(endLabel)
                    .font(.caption2)
                    .foregroundStyle(palette.tertiary)
            }
            .monospacedDigit()
        }
    }
}

private struct MinimalistProgressBar: View {
    let progress: Double
    let palette: MonochromeColorPalette

    var body: some View {
        GeometryReader { geometry in
            let clamped = CGFloat(min(max(progress, 0), 1))
            let width = geometry.size.width
            let filled = width * clamped

            ZStack(alignment: .leading) {
                // Track
                Capsule(style: .continuous)
                    .fill(palette.divider)
                
                // Fill
                Capsule(style: .continuous)
                    .fill(palette.accent)
                    .frame(width: max(filled, clamped > 0 ? 2 : 0))
            }
            .animation(.easeOut(duration: 0.3), value: progress)
        }
    }
}

// MARK: - Timer Logic
private struct FocusTimerSnapshot {
    let date: Date
    let progress: Double
    let elapsedSeconds: Int?
    let remainingSeconds: Int?
    let totalSeconds: Int?
    let endDate: Date?
    let subtitle: FocusSubtitleParser.ParsedSubtitle

    var isRunning: Bool {
        subtitle.isRunning && (remainingSeconds ?? 0) > 0
    }
}

private enum FocusTimerAnalyzer {
    static func snapshot(for state: LiveActivityAttributes.ContentState, at date: Date) -> FocusTimerSnapshot {
        let subtitle = FocusSubtitleParser.parse(state.subtitle)
        let rawEndDate = state.timerEndDateInMilliseconds.map { Date(timeIntervalSince1970: $0 / 1000) }
        let isRunning = subtitle.isRunning

        var remaining: Int? = nil
        if isRunning, let rawEndDate {
            remaining = max(Int(rawEndDate.timeIntervalSince(date)), 0)
        }

        if remaining == nil, let explicit = subtitle.remainingSeconds {
            remaining = max(explicit, 0)
        }

        if remaining == nil, let rawEndDate {
            remaining = max(Int(rawEndDate.timeIntervalSince(date)), 0)
        }

        let total = subtitle.totalSeconds

        var elapsed: Int? = nil
        if let total, let remaining {
            elapsed = max(total - remaining, 0)
        } else if let explicitElapsed = subtitle.elapsedSeconds {
            elapsed = max(explicitElapsed, 0)
        }

        if elapsed == nil, let total, let progress = state.progress {
            elapsed = max(Int(round(progress * Double(total))), 0)
        }

        var progressValue: Double
        if let total, let remaining, total > 0 {
            progressValue = 1 - Double(remaining) / Double(total)
        } else if let progress = state.progress {
            progressValue = progress
        } else {
            progressValue = 0
        }

        if !isRunning, let progress = state.progress {
            progressValue = progress
        }

        progressValue = min(max(progressValue, 0), 1)

        let endDate = isRunning ? rawEndDate : nil

        return FocusTimerSnapshot(
            date: date,
            progress: progressValue,
            elapsedSeconds: elapsed,
            remainingSeconds: remaining,
            totalSeconds: total,
            endDate: endDate,
            subtitle: subtitle
        )
    }
}

private enum FocusTimeFormatter {
    static func formattedRemaining(snapshot: FocusTimerSnapshot, fallback: String = "--:--") -> String {
        guard let seconds = snapshot.remainingSeconds else { return fallback }
        return format(seconds: seconds)
    }

    static func formattedElapsed(snapshot: FocusTimerSnapshot, fallback: String = "--:--") -> String {
        guard let seconds = snapshot.elapsedSeconds else { return fallback }
        return format(seconds: seconds)
    }

    static func formattedTotal(snapshot: FocusTimerSnapshot, fallback: String = "--:--") -> String {
        if let total = snapshot.totalSeconds {
            return format(seconds: total)
        }
        return fallback
    }

    static func format(seconds: Int) -> String {
        let clamped = max(seconds, 0)
        let hours = clamped / 3600
        let minutes = (clamped / 60) % 60
        let remaining = clamped % 60
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, remaining)
        }
        return String(format: "%02d:%02d", minutes, remaining)
    }
}

private enum FocusStatusFormatter {
    static func display(from snapshot: FocusTimerSnapshot) -> String {
        let raw = snapshot.subtitle.status.trimmingCharacters(in: .whitespacesAndNewlines)
        if raw.isEmpty {
            return snapshot.isRunning ? "In progress" : "Paused"
        }
        return raw
    }
}

private enum FocusSubtitleParser {
    struct ParsedSubtitle {
        let status: String
        let remainingLabel: String?
        let sessionLabel: String?
        let totalLabel: String?
        let breakLabel: String?
        let isMuted: Bool
        let isRunning: Bool

        var remainingSeconds: Int? {
            FocusSubtitleParser.seconds(from: remainingLabel)
        }

        var totalSeconds: Int? {
            FocusSubtitleParser.seconds(from: totalLabel)
        }

        var elapsedSeconds: Int? {
            guard let total = totalSeconds, let remaining = remainingSeconds else { return nil }
            return max(total - remaining, 0)
        }
    }

    static func parse(_ subtitle: String?) -> ParsedSubtitle {
        guard let subtitle else {
            return .init(
                status: "In progress",
                remainingLabel: nil,
                sessionLabel: nil,
                totalLabel: nil,
                breakLabel: nil,
                isMuted: false,
                isRunning: true
            )
        }

        let segments = subtitle
            .split(separator: "•")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        guard !segments.isEmpty else {
            return .init(
                status: "In progress",
                remainingLabel: nil,
                sessionLabel: nil,
                totalLabel: nil,
                breakLabel: nil,
                isMuted: false,
                isRunning: true
            )
        }

        let status = segments.first ?? "In progress"
        var remaining: String?
        var session: String?
        var total: String?
        var breakInfo: String?
        var muted = false

        for segment in segments.dropFirst() {
            let lowercased = segment.lowercased()

            if lowercased.contains("muted") {
                muted = true
                continue
            }

            if lowercased.contains("left") {
                if remaining == nil {
                    remaining = segment
                }
                continue
            }

            if lowercased.contains("session") {
                session = segment
                continue
            }

            if lowercased.contains("total") {
                total = segment
                continue
            }

            if lowercased.contains("break") {
                breakInfo = segment
                continue
            }

            if session == nil {
                session = segment
            } else if breakInfo == nil {
                breakInfo = segment
            } else if total == nil {
                total = segment
            }
        }

        let isRunning = !status.localizedCaseInsensitiveContains("paused") && !status.localizedCaseInsensitiveContains("stopped")

        return .init(
            status: status,
            remainingLabel: remaining,
            sessionLabel: session,
            totalLabel: total,
            breakLabel: breakInfo,
            isMuted: muted,
            isRunning: isRunning
        )
    }

    private static func seconds(from label: String?) -> Int? {
        guard let label else { return nil }
        guard let timeComponent = label.split(separator: " ").first(where: { $0.contains(":") }) else {
            return nil
        }

        let parts = timeComponent.split(separator: ":").compactMap { Int($0) }
        guard !parts.isEmpty else { return nil }

        if parts.count == 1 {
            return parts[0]
        }
        if parts.count == 2 {
            return parts[0] * 60 + parts[1]
        }
        if parts.count == 3 {
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
        }

        return nil
    }
}

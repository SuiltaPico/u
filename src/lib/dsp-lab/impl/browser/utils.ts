import { AutomationRate, IAudioNodeMetaContainner, IAudioParam } from "../../interface";

export function AudioNode_to_INodeMetaContainner_impl(audio_node: AudioNode) {
  return {
    get_input() {
      return audio_node.numberOfInputs
    },
    get_output() {
      return audio_node.numberOfOutputs
    },
    get_channel_count() {
      return audio_node.channelCount
    },
    set_channel_count(channel_count) {
      audio_node.channelCount = channel_count
    },
    get_channel_count_mode() {
      return audio_node.channelCountMode
    },
    set_channel_count_mode(channel_count_mode) {
      audio_node.channelCountMode = channel_count_mode
    },
    get_channel_interpretation() {
      return audio_node.channelInterpretation
    },
    set_channel_interpretation(channel_interpretation) {
      audio_node.channelInterpretation = channel_interpretation
    },
  } satisfies IAudioNodeMetaContainner
}

export function AudioParam_to_IParam_impl(audio_param: AudioParam, automation_rate: AutomationRate) {
  return {
    get_value_meta() {
      return {
        default_value: audio_param.defaultValue,
        min_value: audio_param.minValue,
        max_value: audio_param.maxValue
      }
    },
    get_value() {
      return audio_param.value
    },
    get_automation_rate() {
      return automation_rate
    },
    set_value_at_time(value, start_time) {
      audio_param.setValueAtTime(value, start_time)
    },
    linear_ramp_to_value_at_time(value, end_time) {
      audio_param.linearRampToValueAtTime(value, end_time)
    },
    exponential_ramp_to_value_at_time(value, end_time) {
      audio_param.exponentialRampToValueAtTime(value, end_time)
    },
    set_target_at_time(target, start_time, time_constant) {
      audio_param.setTargetAtTime(target, start_time, time_constant)
    },
    set_value_curve_at_time(values, start_time, duration) {
      audio_param.setValueCurveAtTime(values, start_time, duration);
    },
    cancel_scheduled_values(cancel_time) {
      audio_param.cancelScheduledValues(cancel_time)
    },
    // toJSON() {
    //   return {}
    // },
  } satisfies IAudioParam
}
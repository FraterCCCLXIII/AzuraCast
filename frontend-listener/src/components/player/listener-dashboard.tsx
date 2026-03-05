"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNowPlaying } from "@/hooks/use-now-playing";
import { useRequests } from "@/hooks/use-requests";
import { useStations } from "@/hooks/use-stations";
import { AzuraCastStation } from "@/types/azuracast";
import { submitSongRequest } from "@/lib/azuracast/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ListenerDashboardProps {
  stationShortName?: string;
}

interface StreamOption {
  url: string;
  title: string;
}

const LAST_STATION_KEY = "listener-last-station";
const PLAYER_VOLUME_KEY = "listener-player-volume";
const STREAM_KEY_PREFIX = "listener-stream-url";

function formatDuration(totalSeconds?: number): string {
  if (!totalSeconds || totalSeconds <= 0) {
    return "0:00";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getStreamStorageKey(stationCode: string): string {
  return `${STREAM_KEY_PREFIX}-${stationCode}`;
}

function getDefaultStreamUrl(station?: AzuraCastStation): string {
  if (!station) {
    return "";
  }

  if (station.hls_enabled && station.hls_is_default && station.hls_url) {
    return station.hls_url;
  }

  return station.listen_url ?? "";
}

export function ListenerDashboard({ stationShortName }: ListenerDashboardProps) {
  const [selectedStation, setSelectedStation] = useState<string>(() => {
    if (typeof window === "undefined") {
      return stationShortName ?? "";
    }
    return window.localStorage.getItem(LAST_STATION_KEY) ?? stationShortName ?? "";
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [hasHydratedVolume, setHasHydratedVolume] = useState(false);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const initialStation =
      window.localStorage.getItem(LAST_STATION_KEY) ?? stationShortName ?? "";
    if (!initialStation) {
      return "";
    }

    return window.localStorage.getItem(getStreamStorageKey(initialStation)) ?? "";
  });
  const [preMuteVolume, setPreMuteVolume] = useState(70);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [requestSearchInput, setRequestSearchInput] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [requestPage, setRequestPage] = useState(1);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [submittingRequestId, setSubmittingRequestId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stations = useStations();

  useEffect(() => {
    if (selectedStation === "") {
      return;
    }
    window.localStorage.setItem(LAST_STATION_KEY, selectedStation);
  }, [selectedStation]);

  useEffect(() => {
    const savedVolume = window.localStorage.getItem(PLAYER_VOLUME_KEY);
    if (savedVolume !== null) {
      const parsedVolume = Number(savedVolume);
      if (!Number.isNaN(parsedVolume)) {
        const nextVolume = Math.min(100, Math.max(0, parsedVolume));
        setVolume(nextVolume);
        if (nextVolume > 0) {
          setPreMuteVolume(nextVolume);
        }
      }
    }
    setHasHydratedVolume(true);
  }, []);

  useEffect(() => {
    if (!hasHydratedVolume) {
      return;
    }

    if (!audioRef.current) {
      return;
    }

    audioRef.current.volume = volume / 100;
    window.localStorage.setItem(PLAYER_VOLUME_KEY, String(volume));
  }, [hasHydratedVolume, volume]);

  const { nowPlaying, isLoading, error, refresh } = useNowPlaying({
    stationShortName: selectedStation || stationShortName,
    pollMs: 20000,
    useSse: true,
  });

  const station = nowPlaying?.station;
  const currentTrack = nowPlaying?.now_playing;
  const currentSong = currentTrack?.song;
  const history = nowPlaying?.song_history ?? [];
  const listenersCurrent = nowPlaying?.listeners?.current ?? 0;
  const listenersTotal = nowPlaying?.listeners?.total ?? 0;
  const listenersUnique = nowPlaying?.listeners?.unique ?? 0;
  const trackElapsed = currentTrack?.elapsed ?? 0;
  const trackDuration = currentTrack?.duration ?? 0;
  const stationId = station?.id;
  const requestsEnabled = station?.requests_enabled ?? false;

  const {
    items: requestItems,
    isLoading: requestsLoading,
    error: requestsError,
    total: requestsTotal,
    totalPages: requestsTotalPages,
    perPage: requestsPerPage,
    refresh: refreshRequests,
  } = useRequests({
    stationId: requestsEnabled ? stationId : undefined,
    searchPhrase: requestSearch,
    page: requestPage,
    perPage: 25,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLiveElapsed(Math.max(0, trackElapsed));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [trackElapsed, currentTrack?.played_at]);

  useEffect(() => {
    if (!trackDuration) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setLiveElapsed((value) => Math.min(trackDuration, value + 1));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [trackDuration, currentTrack?.played_at]);

  const streamOptions = useMemo(() => {
    if (!station) {
      return [] as StreamOption[];
    }

    const options: StreamOption[] = [];
    const seen = new Set<string>();

    if (station.hls_enabled && station.hls_url) {
      options.push({ url: station.hls_url, title: "HLS Stream" });
      seen.add(station.hls_url);
    }

    station.mounts?.forEach((mount) => {
      if (!mount.url || seen.has(mount.url)) {
        return;
      }
      seen.add(mount.url);
      options.push({
        url: mount.url,
        title: mount.name || mount.path || "Mount Stream",
      });
    });

    station.remotes?.forEach((remote) => {
      if (!remote.url || seen.has(remote.url)) {
        return;
      }
      seen.add(remote.url);
      options.push({
        url: remote.url,
        title: `Remote: ${remote.name || "Stream"}`,
      });
    });

    if (station.listen_url && !seen.has(station.listen_url)) {
      options.push({ url: station.listen_url, title: "Default Stream" });
    }

    return options;
  }, [station]);

  const effectiveStreamUrl = useMemo(() => {
    if (!streamOptions.length) {
      return station?.listen_url ?? null;
    }

    if (activeStreamUrl && streamOptions.some((entry) => entry.url === activeStreamUrl)) {
      return activeStreamUrl;
    }

    const defaultUrl = getDefaultStreamUrl(station);
    const fallback = streamOptions.find((entry) => entry.url === defaultUrl)?.url;
    return fallback ?? streamOptions[0]?.url ?? null;
  }, [activeStreamUrl, station, streamOptions]);

  const progressPercent = useMemo(() => {
    if (!trackDuration) {
      return 0;
    }
    return Math.min(100, Math.max(0, (liveElapsed / trackDuration) * 100));
  }, [liveElapsed, trackDuration]);

  const stationOptions = useMemo(() => {
    if (!stations.length && station) {
      return [{ shortcode: station.shortcode, name: station.name }];
    }

    if (!station) {
      return stations;
    }

    const hasCurrent = stations.some(
      (entry) => entry.shortcode === station.shortcode
    );
    if (hasCurrent) {
      return stations;
    }

    return [
      ...stations,
      { shortcode: station.shortcode, name: station.name || station.shortcode },
    ].sort((a, b) => a.name.localeCompare(b.name));
  }, [station, stations]);

  const visibleHistory = showAllHistory ? history : history.slice(0, 8);

  const handleSubmitRequest = async (requestId: string, requestUrl: string) => {
    setSubmittingRequestId(requestId);
    try {
      const result = await submitSongRequest(requestUrl);
      toast.success(result.message || "Request submitted successfully.");
      await refreshRequests();
    } catch (err) {
      toast.error((err as Error).message || "Unable to submit request.");
    } finally {
      setSubmittingRequestId(null);
    }
  };

  const togglePlayback = async () => {
    if (!audioRef.current || !effectiveStreamUrl) {
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setAudioError(null);
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch {
      setAudioError("Unable to start playback in this browser yet.");
    }
  };

  const toggleMute = () => {
    if (volume === 0) {
      setVolume(preMuteVolume > 0 ? preMuteVolume : 70);
      return;
    }

    setPreMuteVolume(volume);
    setVolume(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Custom Listener Frontend</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {station?.name ?? "Station"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{listenersCurrent} listening</Badge>
            <Badge variant={error && !nowPlaying ? "destructive" : "outline"}>
              {error && !nowPlaying ? "Reconnecting..." : "Live"}
            </Badge>
            {nowPlaying?.live?.is_live ? (
              <Badge>
                {`Live DJ${nowPlaying.live.streamer_name ? `: ${nowPlaying.live.streamer_name}` : ""}`}
              </Badge>
            ) : null}
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Station & Playback Settings</CardTitle>
            <CardDescription>
              Switch station feed, stream endpoint, and playback preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Station</p>
              <Select
                value={selectedStation}
                onValueChange={(value) => {
                  setSelectedStation(value);
                  setIsPlaying(false);
                  setRequestPage(1);
                  setRequestSearch("");
                  setRequestSearchInput("");
                  const savedStream = window.localStorage.getItem(getStreamStorageKey(value));
                  setActiveStreamUrl(savedStream ?? "");
                  if (audioRef.current) {
                    audioRef.current.pause();
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  {stationOptions.length ? (
                    stationOptions.map((entry) => (
                      <SelectItem key={entry.shortcode} value={entry.shortcode}>
                        {entry.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no-station" disabled>
                      No stations available yet
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Stream</p>
              <Select
                value={effectiveStreamUrl ?? ""}
                onValueChange={(value) => {
                  setActiveStreamUrl(value);
                  if (selectedStation) {
                    window.localStorage.setItem(getStreamStorageKey(selectedStation), value);
                  }
                  setIsPlaying(false);
                  if (audioRef.current) {
                    audioRef.current.pause();
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select stream" />
                </SelectTrigger>
                <SelectContent>
                  {streamOptions.length ? (
                    streamOptions.map((stream) => (
                      <SelectItem key={stream.url} value={stream.url}>
                        {stream.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no-stream" disabled>
                      No stream options available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Now Playing</CardTitle>
                <CardDescription>
                  {error
                    ? "Unable to fetch now playing data."
                    : "Live metadata from AzuraCast"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {error && !nowPlaying ? (
                  <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                    <p className="text-sm text-destructive">{error}</p>
                    <Button size="sm" variant="outline" onClick={() => void refresh()}>
                      Retry
                    </Button>
                  </div>
                ) : null}

                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="h-48 w-full overflow-hidden rounded-lg bg-muted sm:h-56 sm:w-56">
                    {currentSong?.art ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentSong.art}
                        alt={currentSong.text}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No artwork
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Current track
                    </p>
                    <h2 className="text-xl font-semibold leading-tight sm:text-2xl">
                      {currentSong?.title ?? "No track loaded"}
                    </h2>
                    <p className="text-base text-muted-foreground">
                      {currentSong?.artist ?? "Unknown artist"}
                    </p>
                    {nowPlaying?.live?.is_live && nowPlaying.live.streamer_name ? (
                      <p className="text-sm font-medium text-primary">
                        Live by {nowPlaying.live.streamer_name}
                      </p>
                    ) : null}
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{formatDuration(liveElapsed)}</span>
                      <span>{formatDuration(trackDuration)}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <Button onClick={() => void togglePlayback()} disabled={!effectiveStreamUrl}>
                        {isPlaying ? "Pause stream" : "Play stream"}
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label={volume === 0 ? "Unmute audio" : "Adjust volume"}
                          >
                            {volume === 0 ? <VolumeX /> : <Volume2 />}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-64 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Volume</p>
                            <span
                              className="text-xs text-muted-foreground"
                              suppressHydrationWarning
                            >
                              {volume}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={toggleMute}
                            >
                              {volume === 0 ? "Unmute" : "Mute"}
                            </Button>
                            <Slider
                              aria-label="Volume"
                              value={[volume]}
                              max={100}
                              step={1}
                              onValueChange={(value) => {
                                const next = value[0] ?? 70;
                                setVolume(next);
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Dialog
                        open={requestModalOpen}
                        onOpenChange={(open) => {
                          setRequestModalOpen(open);
                          if (open) {
                            setRequestPage(1);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button type="button" variant="secondary" disabled={!requestsEnabled}>
                            Request Song
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Song Requests</DialogTitle>
                            <DialogDescription>
                              Browse requestable songs and submit a request to play one next.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            {!requestsEnabled ? (
                              <div className="rounded-lg border border-border bg-muted/40 p-3">
                                <p className="text-sm font-medium">
                                  Song requests are disabled for this station.
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Enable requests in AzuraCast station settings and include at least
                                  one enabled playlist in requests.
                                </p>
                              </div>
                            ) : null}

                            <div className="flex flex-col gap-3 sm:flex-row">
                              <Input
                                value={requestSearchInput}
                                onChange={(event) => setRequestSearchInput(event.target.value)}
                                placeholder="Search title, artist, album, genre..."
                                disabled={!requestsEnabled}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                disabled={!requestsEnabled}
                                onClick={() => {
                                  setRequestPage(1);
                                  setRequestSearch(requestSearchInput);
                                }}
                              >
                                Search
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                disabled={!requestsEnabled}
                                onClick={() => {
                                  setRequestSearchInput("");
                                  setRequestSearch("");
                                  setRequestPage(1);
                                }}
                              >
                                Clear
                              </Button>
                            </div>

                            {requestsEnabled && requestsError ? (
                              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                                <p className="text-sm text-destructive">{requestsError}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Requests may be unavailable if this station has no request-enabled playlists.
                                </p>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="mt-3"
                                  onClick={() => void refreshRequests()}
                                >
                                  Retry
                                </Button>
                              </div>
                            ) : null}

                            {requestsEnabled && !requestsError && requestsLoading ? (
                              <div className="space-y-3">
                                <Skeleton className="h-14 w-full" />
                                <Skeleton className="h-14 w-full" />
                                <Skeleton className="h-14 w-full" />
                              </div>
                            ) : null}

                            {requestsEnabled && !requestsError && !requestsLoading ? (
                              <>
                                {requestItems.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">
                                    No requestable songs found for this station.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {requestItems.map((item) => (
                                      <div
                                        key={item.request_id}
                                        className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="h-10 w-10 overflow-hidden rounded bg-muted">
                                            {item.song.art ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img
                                                src={item.song.art}
                                                alt={item.song.text}
                                                className="h-full w-full object-cover"
                                              />
                                            ) : null}
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium leading-snug">
                                              {item.song.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {item.song.artist}
                                            </p>
                                          </div>
                                        </div>
                                        <Button
                                          type="button"
                                          size="sm"
                                          disabled={submittingRequestId === item.request_id}
                                          onClick={() =>
                                            void handleSubmitRequest(item.request_id, item.request_url)
                                          }
                                        >
                                          {submittingRequestId === item.request_id
                                            ? "Requesting..."
                                            : "Request"}
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="flex items-center justify-between">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={requestPage <= 1}
                                    onClick={() => setRequestPage((value) => Math.max(1, value - 1))}
                                  >
                                    Previous
                                  </Button>
                                  <span className="text-xs text-muted-foreground">
                                    Page {requestPage} of {requestsTotalPages} ({requestsTotal} songs)
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                      requestsTotalPages > 0
                                        ? requestPage >= requestsTotalPages
                                        : requestItems.length < requestsPerPage
                                    }
                                    onClick={() => setRequestPage((value) => value + 1)}
                                  >
                                    Next
                                  </Button>
                                </div>
                              </>
                            ) : null}
                          </div>
                        </DialogContent>
                      </Dialog>
                      {effectiveStreamUrl ? (
                        <Button variant="outline" asChild>
                          <a href={effectiveStreamUrl} target="_blank" rel="noreferrer">
                            Open stream URL
                          </a>
                        </Button>
                      ) : null}
                    </div>
                    {audioError ? (
                      <p className="text-sm text-destructive">{audioError}</p>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Playing Next</CardTitle>
                  <CardDescription>Upcoming queued track</CardDescription>
                </CardHeader>
                <CardContent>
                  {nowPlaying?.playing_next?.song ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{nowPlaying.playing_next.song.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {nowPlaying.playing_next.song.artist}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No next track in queue.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Listener Stats</CardTitle>
                  <CardDescription>Current stream audience snapshot</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="text-lg font-semibold">{listenersCurrent}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Unique</p>
                    <p className="text-lg font-semibold">{listenersUnique}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold">{listenersTotal}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Tracks</CardTitle>
                  <CardDescription>History from current station feed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No track history available yet.
                    </p>
                  ) : (
                    visibleHistory.map((entry) => (
                      <div key={`${entry.played_at}-${entry.song.id}`} className="space-y-2">
                        <p className="text-sm font-medium leading-snug">{entry.song.title}</p>
                        <p className="text-xs text-muted-foreground">{entry.song.artist}</p>
                        <Separator />
                      </div>
                    ))
                  )}
                  {history.length > 8 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAllHistory((value) => !value)}
                    >
                      {showAllHistory ? "Show less" : "Show full history"}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <audio
          ref={audioRef}
          src={effectiveStreamUrl ?? undefined}
          preload="none"
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      </div>
    </div>
  );
}

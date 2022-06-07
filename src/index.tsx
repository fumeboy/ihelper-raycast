import { ActionPanel, List, Action } from "@raycast/api";
import { useEffect, useState } from "react";
import { action, actionEditDict } from "./action";
import { getItems, loaddict, dictLine } from "./databaseclient";

export default function CommandSearch() {
  const [searchText, setSearchText] = useState("");
  const [filteredList, setFilteredList] = useState([] as dictLine[]);
  const [showingDetail, setShowingDetail] = useState(false);

  useEffect(() => {
    setFilteredList(getItems(searchText));
  }, [searchText]);

  let list = (
    <List
      enableFiltering={false}
      isShowingDetail={showingDetail}
      onSearchTextChange={setSearchText}
      navigationTitle="ihelper"
      searchBarPlaceholder="help remember command or hotkey and output them quickly"
    >
      {filteredList.length > 0 ? (
        filteredList.map((item) => {
          let tags = item.tag.split(";").map((k) => k.trim());

          return (
            <List.Item
              key={`line${item.lineNo}`}
              title={item.desc}
              subtitle={item.output}
              accessories={tags.map((t) => {
                return { text: t };
              })}
              detail={
                <List.Item.Detail
                  markdown={`
## description
${item.desc}

## output
${item.output}
                  `}
                  metadata={
                    <List.Item.Detail.Metadata>
                      {tags
                        .filter((k) => k.length > 0)
                        .map((tag) => (
                          <List.Item.Detail.Metadata.Label key={tag} title={"tag"} text={tag} />
                        ))}
                    </List.Item.Detail.Metadata>
                  }
                />
              }
              actions={
                <ActionPanel>
                  <Action title="output" onAction={()=>action(item)} />
                  <Action title="Toggle Detail" onAction={() => setShowingDetail(!showingDetail)} />
                </ActionPanel>
              }
            />
          );
        })
      ) : (
        <>
          <List.Item key={"helpi"} title={"input to search in dictionary"} />
          <List.Item
            key={"s"}
            title={"reload dictionary"}
            actions={
              <ActionPanel title="commands">
                <Action title="reload dict" onAction={() => loaddict()} />
              </ActionPanel>
            }
          />
          <List.Item
            key={"w"}
            title={"edit dictionary"}
            actions={
              <ActionPanel title="commands">
                <Action title="edit dict" onAction={()=>actionEditDict()} />
              </ActionPanel>
            }
          />
        </>
      )}
    </List>
  );

  return list;
}
